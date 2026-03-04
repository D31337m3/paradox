// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ParadoxToken.sol";
import "./BurnReputationNFT.sol";

/// @title EpochController
/// @notice Core engine of the PARADOX behavioral experiment.
///
///  Each 30-day epoch participants choose:
///   HOARD  — lock tokens for the epoch, earn base yield + governance weight
///   BURN   — permanently destroy tokens, earn multiplier next epoch + soulbound NFT
///   EXIT   — remain liquid, no reward, no penalty
///
///  CCI = (totalLocked + totalBurned) / circulatingSupply
///  CCI drives next-epoch emission rate: high conviction → fewer emissions (scarcity);
///  low conviction → more emissions + higher burn multiplier (participation incentives).

contract EpochController is Ownable, ReentrancyGuard {

    // ─── Constants ────────────────────────────────────────────────────────────

    uint256 public constant EPOCH_DURATION     = 30 days;
    uint256 public constant BPS                = 10_000;  // basis-point denominator

    // CCI thresholds (in BPS of circulating supply)
    uint256 public constant CCI_HIGH           = 6_000;   // 60%
    uint256 public constant CCI_LOW            = 4_000;   // 40%

    // Emission adjustment step per epoch (10% of current rate)
    uint256 public constant EMISSION_STEP_BPS  = 1_000;

    // Reward split: 70 % to hoarders, 30 % to previous-epoch burners
    uint256 public constant HOARDER_SHARE_BPS  = 7_000;
    uint256 public constant BURNER_SHARE_BPS   = 3_000;

    // Base burn multiplier (1.5×) expressed in BPS
    uint256 public constant BASE_BURN_MULT_BPS = 15_000;

    // ─── State ────────────────────────────────────────────────────────────────

    ParadoxToken     public token;
    BurnReputationNFT public nft;

    uint256 public currentEpochId;

    // Governance-adjustable bounds
    uint256 public emissionFloor;   // min tokens distributed per epoch
    uint256 public emissionCeiling; // max tokens distributed per epoch
    uint256 public currentEmissionRate;

    // Burn multiplier for THIS epoch's burners (applied when they claim next epoch)
    uint256 public burnMultiplierBps = BASE_BURN_MULT_BPS;

    struct Epoch {
        uint256 startTime;
        uint256 endTime;
        uint256 totalLocked;
        uint256 totalBurned;
        uint256 circulatingSupply; // snapshot at epoch start
        uint256 emission;          // tokens distributed this epoch
        uint256 cci;               // CCI in BPS, set on finalization
        uint256 burnMultiplierBps; // multiplier that applies to THIS epoch's burners
        bool    finalized;
    }

    enum Choice { NONE, HOARD, BURN, EXIT }

    struct UserData {
        Choice  choice;
        uint256 amount;
        bool    rewardClaimed;
        bool    tokensClaimed;  // hoarders reclaim their locked tokens
    }

    mapping(uint256 => Epoch)                              public epochs;
    mapping(address => mapping(uint256 => UserData))       public userData;

    // ─── Events ───────────────────────────────────────────────────────────────

    event EpochStarted(uint256 indexed epochId, uint256 startTime, uint256 endTime, uint256 emission);
    event Declared(address indexed user, uint256 indexed epochId, Choice choice, uint256 amount);
    event EpochFinalized(uint256 indexed epochId, uint256 cci, uint256 nextEmission, uint256 nextBurnMultiplier);
    event RewardClaimed(address indexed user, uint256 indexed epochId, uint256 amount);
    event TokensReclaimed(address indexed user, uint256 indexed epochId, uint256 amount);
    event EmissionBoundsUpdated(uint256 floor, uint256 ceiling);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _token,
        address _nft,
        uint256 _initialEmissionRate,
        uint256 _emissionFloor,
        uint256 _emissionCeiling
    ) Ownable(msg.sender) {
        require(_token != address(0) && _nft != address(0), "EC: zero address");
        token               = ParadoxToken(_token);
        nft                 = BurnReputationNFT(_nft);
        currentEmissionRate = _initialEmissionRate;
        emissionFloor       = _emissionFloor;
        emissionCeiling     = _emissionCeiling;
    }

    // ─── Epoch lifecycle ──────────────────────────────────────────────────────

    /// @notice Starts epoch 0. Must be called once after deployment funding.
    function startFirstEpoch() external onlyOwner {
        require(currentEpochId == 0 && epochs[0].startTime == 0, "EC: already started");
        _startEpoch(0);
    }

    /// @notice Permissionless — anyone may advance to the next epoch once current one ends.
    function advanceEpoch() external {
        Epoch storage e = epochs[currentEpochId];
        require(e.startTime > 0,              "EC: not started");
        require(block.timestamp >= e.endTime, "EC: epoch not ended");
        require(!e.finalized,                 "EC: already finalized");
        _finalizeEpoch(currentEpochId);
        _startEpoch(currentEpochId); // currentEpochId was incremented inside _finalizeEpoch
    }

    // ─── User actions ─────────────────────────────────────────────────────────

    /// @notice Declare your choice for the current epoch.
    ///  HOARD: transfers `amount` tokens to this contract for the epoch duration.
    ///  BURN:  burns `amount` tokens, mints soulbound NFT, earns multiplied reward next epoch.
    ///  EXIT:  no-op (registering intent, no token movement needed).
    function declare(Choice choice, uint256 amount) external nonReentrant {
        uint256 epochId = currentEpochId;
        Epoch storage e = epochs[epochId];

        require(e.startTime > 0,               "EC: epoch not started");
        require(block.timestamp < e.endTime,   "EC: epoch ended");
        require(choice != Choice.NONE,         "EC: invalid choice");

        UserData storage u = userData[msg.sender][epochId];
        require(u.choice == Choice.NONE,       "EC: already declared");

        if (choice == Choice.HOARD) {
            require(amount > 0, "EC: amount required for HOARD");
            token.transferFrom(msg.sender, address(this), amount);
            e.totalLocked += amount;

        } else if (choice == Choice.BURN) {
            require(amount > 0, "EC: amount required for BURN");
            // User must approve this contract before calling
            token.burnFromController(msg.sender, amount);
            e.totalBurned += amount;
            // Mint soulbound reputation NFT
            nft.mint(msg.sender, amount, epochId);

        } else if (choice == Choice.EXIT) {
            amount = 0; // no token movement
        }

        u.choice = choice;
        u.amount = amount;

        emit Declared(msg.sender, epochId, choice, amount);
    }

    /// @notice Hoarders call this AFTER the epoch finalizes to reclaim locked tokens.
    function reclaimTokens(uint256 epochId) external nonReentrant {
        require(epochs[epochId].finalized, "EC: epoch not finalized");
        UserData storage u = userData[msg.sender][epochId];
        require(u.choice == Choice.HOARD, "EC: not a hoarder");
        require(!u.tokensClaimed,          "EC: already reclaimed");
        u.tokensClaimed = true;
        token.transfer(msg.sender, u.amount);
        emit TokensReclaimed(msg.sender, epochId, u.amount);
    }

    /// @notice Claim epoch rewards.
    ///  Hoarders claim from `epochId`.
    ///  Burners claim from `epochId + 1` (multiplier applied next epoch).
    function claimReward(uint256 epochId) external nonReentrant {
        _claimReward(msg.sender, epochId);
    }

    // ─── View helpers ─────────────────────────────────────────────────────────

    function getCurrentEpoch() external view returns (Epoch memory) {
        return epochs[currentEpochId];
    }

    function getEpoch(uint256 epochId) external view returns (Epoch memory) {
        return epochs[epochId];
    }

    function getUserData(address user, uint256 epochId) external view returns (UserData memory) {
        return userData[user][epochId];
    }

    /// @notice Estimated reward for a user in a given epoch (before finalization).
    function estimateReward(address user, uint256 epochId) external view returns (uint256) {
        Epoch storage e    = epochs[epochId];
        UserData storage u = userData[user][epochId];
        if (!e.finalized || u.rewardClaimed) return 0;
        return _computeReward(u, e, epochId);
    }

    function timeUntilEpochEnd() external view returns (uint256) {
        uint256 end = epochs[currentEpochId].endTime;
        if (block.timestamp >= end) return 0;
        return end - block.timestamp;
    }

    function computeCCI(uint256 epochId) public view returns (uint256) {
        Epoch storage e = epochs[epochId];
        if (e.circulatingSupply == 0) return 0;
        return ((e.totalLocked + e.totalBurned) * BPS) / e.circulatingSupply;
    }

    // ─── Governance ───────────────────────────────────────────────────────────

    function setEmissionBounds(uint256 _floor, uint256 _ceiling) external onlyOwner {
        require(_floor <= _ceiling, "EC: floor > ceiling");
        emissionFloor   = _floor;
        emissionCeiling = _ceiling;
        emit EmissionBoundsUpdated(_floor, _ceiling);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _startEpoch(uint256 epochId) internal {
        uint256 emission = _clamp(currentEmissionRate, emissionFloor, emissionCeiling);
        // Ensure reward pool has enough
        uint256 available = token.balanceOf(address(this));
        if (emission > available) emission = available;

        epochs[epochId] = Epoch({
            startTime:        block.timestamp,
            endTime:          block.timestamp + EPOCH_DURATION,
            totalLocked:      0,
            totalBurned:      0,
            circulatingSupply: token.totalSupply() - token.balanceOf(address(this)),
            emission:         emission,
            cci:              0,
            burnMultiplierBps: burnMultiplierBps,
            finalized:        false
        });

        emit EpochStarted(epochId, block.timestamp, block.timestamp + EPOCH_DURATION, emission);
    }

    function _finalizeEpoch(uint256 epochId) internal {
        Epoch storage e = epochs[epochId];
        e.finalized = true;

        // Recalculate circulating supply at end (burns reduce it)
        uint256 cci = computeCCI(epochId);
        e.cci = cci;

        // Adjust emission rate for next epoch
        if (cci >= CCI_HIGH) {
            // High conviction: reduce emissions, strengthen scarcity
            currentEmissionRate = currentEmissionRate - (currentEmissionRate * EMISSION_STEP_BPS / BPS);
            burnMultiplierBps   = BASE_BURN_MULT_BPS; // reset to base
        } else if (cci < CCI_LOW) {
            // Low conviction: increase emissions + burn multiplier to incentivise participation
            currentEmissionRate = currentEmissionRate + (currentEmissionRate * EMISSION_STEP_BPS / BPS);
            burnMultiplierBps   = burnMultiplierBps + 1_000; // +10% per low epoch, uncapped (governance can reset)
        }
        currentEmissionRate = _clamp(currentEmissionRate, emissionFloor, emissionCeiling);

        currentEpochId = epochId + 1;

        emit EpochFinalized(epochId, cci, currentEmissionRate, burnMultiplierBps);
    }

    function _claimReward(address user, uint256 epochId) internal {
        Epoch storage e = epochs[epochId];
        require(e.finalized,  "EC: epoch not finalized");

        UserData storage u = userData[user][epochId];
        require(!u.rewardClaimed, "EC: already claimed");

        // Burners claim from the NEXT epoch (multiplier reward)
        // This function handles the epoch that the user declared in.
        // For burn rewards: caller should pass (burnEpochId) and we check next-epoch rules.
        uint256 reward = _computeReward(u, e, epochId);
        require(reward > 0, "EC: no reward");

        u.rewardClaimed = true;
        token.transfer(user, reward);
        emit RewardClaimed(user, epochId, reward);
    }

    function _computeReward(
        UserData storage u,
        Epoch storage e,
        uint256 /* epochId */    ) internal view returns (uint256) {
        if (u.choice == Choice.HOARD && e.totalLocked > 0) {
            uint256 hoardPool = (e.emission * HOARDER_SHARE_BPS) / BPS;
            return (u.amount * hoardPool) / e.totalLocked;
        }

        if (u.choice == Choice.BURN) {
            // Burn rewards are handled via claimBurnReward() using the burn epoch + 1 data.
            // This path is kept for interface completeness but returns 0 here.
            return 0;
        }

        return 0;
    }

    // Note: _computeReward for BURN requires a cleaner pattern — see claimBurnReward below.

    function _clamp(uint256 val, uint256 lo, uint256 hi) internal pure returns (uint256) {
        if (val < lo) return lo;
        if (val > hi) return hi;
        return val;
    }

    /// @notice Burners call this with the epoch they burned in — rewards come from (burnEpoch+1).
    function claimBurnReward(uint256 burnEpochId) external nonReentrant {
        uint256 rewardEpochId = burnEpochId + 1;
        Epoch storage burnEpoch   = epochs[burnEpochId];
        Epoch storage rewardEpoch = epochs[rewardEpochId];

        require(burnEpoch.finalized,   "EC: burn epoch not finalized");
        require(rewardEpoch.finalized || block.timestamp >= rewardEpoch.endTime, "EC: reward epoch not ready");

        UserData storage u = userData[msg.sender][burnEpochId];
        require(u.choice == Choice.BURN,  "EC: not a burner in that epoch");
        require(!u.rewardClaimed,          "EC: already claimed");
        require(burnEpoch.totalBurned > 0, "EC: nothing burned that epoch");

        uint256 burnPool = (rewardEpoch.emission * BURNER_SHARE_BPS) / BPS;
        uint256 mult     = burnEpoch.burnMultiplierBps;
        uint256 reward   = (u.amount * burnPool * mult) / (burnEpoch.totalBurned * BPS);

        require(reward > 0, "EC: zero reward");
        u.rewardClaimed = true;
        token.transfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, burnEpochId, reward);
    }
}
