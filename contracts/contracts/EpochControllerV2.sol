// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ParadoxToken.sol";
import "./BurnReputationNFTv2.sol";

/// @title EpochControllerV2
/// @notice Core engine of the PARADOX behavioral experiment — v2.
///
///  Changes from v1:
///   - Uses token.burnFrom() (ERC20Burnable) instead of burnFromController()
///     so it works independently of ParadoxToken's locked epochController slot.
///   - Per-wallet epoch burn cap (burnCapBps, default 2% of supply) to prevent whale CCI manipulation.
///   - setNFT() admin function — allows upgrading the NFT contract without full redeploy.
///   - emergencyWithdraw() owner function — prevents reward tokens being permanently stuck.
///   - setBurnCapBps() governance function.
contract EpochControllerV2 is Ownable, ReentrancyGuard {

    // ─── Constants ────────────────────────────────────────────────────────────

    uint256 public constant EPOCH_DURATION    = 30 days;
    uint256 public constant BPS               = 10_000;

    uint256 public constant CCI_HIGH          = 6_000;   // 60%
    uint256 public constant CCI_LOW           = 4_000;   // 40%
    uint256 public constant EMISSION_STEP_BPS = 1_000;   // 10% step per epoch

    uint256 public constant HOARDER_SHARE_BPS = 7_000;
    uint256 public constant BURNER_SHARE_BPS  = 3_000;
    uint256 public constant BASE_BURN_MULT    = 15_000;  // 1.5× in BPS

    // ─── State ────────────────────────────────────────────────────────────────

    ParadoxToken      public token;
    BurnReputationNFTv2 public nft;

    uint256 public currentEpochId;
    uint256 public emissionFloor;
    uint256 public emissionCeiling;
    uint256 public currentEmissionRate;
    uint256 public burnMultiplierBps = BASE_BURN_MULT;

    /// @notice Max PDX any single wallet may burn in one epoch (as BPS of totalSupply).
    ///         Default 200 = 2%. Governance-adjustable (10–1000 BPS range).
    uint256 public burnCapBps = 200;

    struct Epoch {
        uint256 startTime;
        uint256 endTime;
        uint256 totalLocked;
        uint256 totalBurned;
        uint256 circulatingSupply;
        uint256 emission;
        uint256 cci;
        uint256 burnMultiplierBps;
        bool    finalized;
    }

    enum Choice { NONE, HOARD, BURN, EXIT }

    struct UserData {
        Choice  choice;
        uint256 amount;
        bool    rewardClaimed;
        bool    tokensClaimed;
    }

    mapping(uint256 => Epoch)                              public epochs;
    mapping(address => mapping(uint256 => UserData))       public userData;
    /// @notice Tracks per-wallet burn total within each epoch for cap enforcement.
    mapping(address => mapping(uint256 => uint256))        public walletEpochBurned;

    // ─── Events ───────────────────────────────────────────────────────────────

    event EpochStarted(uint256 indexed epochId, uint256 startTime, uint256 endTime, uint256 emission);
    event Declared(address indexed user, uint256 indexed epochId, Choice choice, uint256 amount);
    event EpochFinalized(uint256 indexed epochId, uint256 cci, uint256 nextEmission, uint256 nextBurnMult);
    event RewardClaimed(address indexed user, uint256 indexed epochId, uint256 amount);
    event TokensReclaimed(address indexed user, uint256 indexed epochId, uint256 amount);
    event EmissionBoundsUpdated(uint256 floor, uint256 ceiling);
    event NFTUpdated(address nft);
    event BurnCapUpdated(uint256 bps);

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
        nft                 = BurnReputationNFTv2(_nft);
        currentEmissionRate = _initialEmissionRate;
        emissionFloor       = _emissionFloor;
        emissionCeiling     = _emissionCeiling;
    }

    // ─── Epoch lifecycle ──────────────────────────────────────────────────────

    function startFirstEpoch() external onlyOwner {
        require(currentEpochId == 0 && epochs[0].startTime == 0, "EC: already started");
        _startEpoch(0);
    }

    function advanceEpoch() external {
        Epoch storage e = epochs[currentEpochId];
        require(e.startTime > 0,              "EC: not started");
        require(block.timestamp >= e.endTime, "EC: epoch not ended");
        require(!e.finalized,                 "EC: already finalized");
        _finalizeEpoch(currentEpochId);
        _startEpoch(currentEpochId);
    }

    // ─── User actions ─────────────────────────────────────────────────────────

    /// @notice Declare your choice for the current epoch.
    ///  HOARD — lock tokens, earn base yield.
    ///  BURN  — destroy tokens, earn multiplied next-epoch reward + soulbound NFT.
    ///  EXIT  — remain liquid, no reward, no penalty.
    function declare(Choice choice, uint256 amount) external nonReentrant {
        uint256 epochId = currentEpochId;
        Epoch storage e = epochs[epochId];

        require(e.startTime > 0,             "EC: epoch not started");
        require(block.timestamp < e.endTime, "EC: epoch ended");
        require(choice != Choice.NONE,       "EC: invalid choice");

        UserData storage u = userData[msg.sender][epochId];
        require(u.choice == Choice.NONE,     "EC: already declared");

        if (choice == Choice.HOARD) {
            require(amount > 0, "EC: amount required");
            token.transferFrom(msg.sender, address(this), amount);
            e.totalLocked += amount;

        } else if (choice == Choice.BURN) {
            require(amount > 0, "EC: amount required");

            // ── Per-wallet epoch cap ──────────────────────────────────────────
            uint256 cap = (token.totalSupply() * burnCapBps) / BPS;
            require(
                walletEpochBurned[msg.sender][epochId] + amount <= cap,
                "EC: epoch burn cap exceeded"
            );
            walletEpochBurned[msg.sender][epochId] += amount;

            // Uses ERC20Burnable.burnFrom — works without needing token's locked epochController
            token.burnFrom(msg.sender, amount);
            e.totalBurned += amount;

            // Mint soulbound reputation NFT
            nft.mint(msg.sender, amount, epochId);

        } else {
            // EXIT — no token movement
            amount = 0;
        }

        u.choice = choice;
        u.amount = amount;

        emit Declared(msg.sender, epochId, choice, amount);
    }

    /// @notice Hoarders reclaim locked tokens after epoch finalization.
    function reclaimTokens(uint256 epochId) external nonReentrant {
        require(epochs[epochId].finalized, "EC: not finalized");
        UserData storage u = userData[msg.sender][epochId];
        require(u.choice == Choice.HOARD, "EC: not a hoarder");
        require(!u.tokensClaimed,          "EC: already reclaimed");
        u.tokensClaimed = true;
        token.transfer(msg.sender, u.amount);
        emit TokensReclaimed(msg.sender, epochId, u.amount);
    }

    /// @notice Hoarders claim yield from their declared epoch.
    function claimReward(uint256 epochId) external nonReentrant {
        Epoch storage e    = epochs[epochId];
        UserData storage u = userData[msg.sender][epochId];

        require(e.finalized,       "EC: not finalized");
        require(!u.rewardClaimed,  "EC: already claimed");
        require(u.choice == Choice.HOARD, "EC: not a hoarder");
        require(e.totalLocked > 0, "EC: nothing locked");

        uint256 pool   = (e.emission * HOARDER_SHARE_BPS) / BPS;
        uint256 reward = (u.amount * pool) / e.totalLocked;
        require(reward > 0, "EC: zero reward");

        u.rewardClaimed = true;
        token.transfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, epochId, reward);
    }

    /// @notice Burners claim multiplied reward from the epoch AFTER they burned.
    function claimBurnReward(uint256 burnEpochId) external nonReentrant {
        uint256 rewardEpochId     = burnEpochId + 1;
        Epoch storage burnEpoch   = epochs[burnEpochId];
        Epoch storage rewardEpoch = epochs[rewardEpochId];

        require(burnEpoch.finalized, "EC: burn epoch not finalized");
        require(
            rewardEpoch.finalized || block.timestamp >= rewardEpoch.endTime,
            "EC: reward epoch not ready"
        );

        UserData storage u = userData[msg.sender][burnEpochId];
        require(u.choice == Choice.BURN, "EC: not a burner");
        require(!u.rewardClaimed,         "EC: already claimed");
        require(burnEpoch.totalBurned > 0,"EC: nothing burned");

        uint256 pool   = (rewardEpoch.emission * BURNER_SHARE_BPS) / BPS;
        uint256 mult   = burnEpoch.burnMultiplierBps;
        uint256 reward = (u.amount * pool * mult) / (burnEpoch.totalBurned * BPS);
        require(reward > 0, "EC: zero reward");

        u.rewardClaimed = true;
        token.transfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, burnEpochId, reward);
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

    /// @notice Upgrade the NFT contract (e.g. for visual updates) without full redeploy.
    function setNFT(address _nft) external onlyOwner {
        require(_nft != address(0), "EC: zero address");
        nft = BurnReputationNFTv2(_nft);
        emit NFTUpdated(_nft);
    }

    /// @notice Adjust the per-wallet epoch burn cap. Range: 0.1% (10 BPS) to 10% (1000 BPS).
    function setBurnCapBps(uint256 bps) external onlyOwner {
        require(bps >= 10 && bps <= 1000, "EC: out of range");
        burnCapBps = bps;
        emit BurnCapUpdated(bps);
    }

    function setEmissionBounds(uint256 _floor, uint256 _ceiling) external onlyOwner {
        require(_floor <= _ceiling, "EC: floor > ceiling");
        emissionFloor   = _floor;
        emissionCeiling = _ceiling;
        emit EmissionBoundsUpdated(_floor, _ceiling);
    }

    /// @notice Emergency withdrawal of reward pool tokens to owner.
    ///         Prevents funds from ever being permanently locked as happened in v1.
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "EC: zero address");
        token.transfer(to, amount);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _startEpoch(uint256 epochId) internal {
        uint256 emission = _clamp(currentEmissionRate, emissionFloor, emissionCeiling);
        uint256 available = token.balanceOf(address(this));
        if (emission > available) emission = available;

        epochs[epochId] = Epoch({
            startTime:         block.timestamp,
            endTime:           block.timestamp + EPOCH_DURATION,
            totalLocked:       0,
            totalBurned:       0,
            circulatingSupply: token.totalSupply() - token.balanceOf(address(this)),
            emission:          emission,
            cci:               0,
            burnMultiplierBps: burnMultiplierBps,
            finalized:         false
        });

        emit EpochStarted(epochId, block.timestamp, block.timestamp + EPOCH_DURATION, emission);
    }

    function _finalizeEpoch(uint256 epochId) internal {
        Epoch storage e = epochs[epochId];
        e.finalized = true;

        uint256 cci = computeCCI(epochId);
        e.cci = cci;

        if (cci >= CCI_HIGH) {
            currentEmissionRate = currentEmissionRate - (currentEmissionRate * EMISSION_STEP_BPS / BPS);
            burnMultiplierBps   = BASE_BURN_MULT;
        } else if (cci < CCI_LOW) {
            currentEmissionRate = currentEmissionRate + (currentEmissionRate * EMISSION_STEP_BPS / BPS);
            burnMultiplierBps   = burnMultiplierBps + 1_000;
        }
        currentEmissionRate = _clamp(currentEmissionRate, emissionFloor, emissionCeiling);
        currentEpochId      = epochId + 1;

        emit EpochFinalized(epochId, cci, currentEmissionRate, burnMultiplierBps);
    }

    function _clamp(uint256 val, uint256 lo, uint256 hi) internal pure returns (uint256) {
        if (val < lo) return lo;
        if (val > hi) return hi;
        return val;
    }
}
