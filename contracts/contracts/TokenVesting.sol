// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TokenVesting
/// @notice Linear vesting over 24 months for the PARADOX dev allocation (15%).
///         Beneficiary can release vested tokens at any time after cliff.
contract TokenVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20  public token;
    address public beneficiary;

    uint256 public startTime;
    uint256 public duration = 730 days; // 24 months
    uint256 public cliff    = 0;        // no cliff — linear from day 1
    uint256 public released;

    event TokensReleased(address indexed beneficiary, uint256 amount);
    event BeneficiaryUpdated(address indexed oldBeneficiary, address indexed newBeneficiary);

    constructor(address _token, address _beneficiary) Ownable(msg.sender) {
        require(_token       != address(0), "Vesting: zero token");
        require(_beneficiary != address(0), "Vesting: zero beneficiary");
        token       = IERC20(_token);
        beneficiary = _beneficiary;
        startTime   = block.timestamp;
    }

    // ─── Release ──────────────────────────────────────────────────────────────

    /// @notice Releases all currently vested and unreleased tokens to the beneficiary.
    function release() external nonReentrant {
        require(msg.sender == beneficiary || msg.sender == owner(), "Vesting: unauthorized");
        uint256 vested = vestedAmount();
        uint256 releasable = vested - released;
        require(releasable > 0, "Vesting: nothing to release");
        released += releasable;
        token.safeTransfer(beneficiary, releasable);
        emit TokensReleased(beneficiary, releasable);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    /// @notice Total tokens vested as of now.
    function vestedAmount() public view returns (uint256) {
        uint256 total = token.balanceOf(address(this)) + released;
        if (block.timestamp < startTime + cliff) return 0;
        if (block.timestamp >= startTime + duration) return total;
        return (total * (block.timestamp - startTime)) / duration;
    }

    /// @notice Tokens that can be released right now.
    function releasableAmount() external view returns (uint256) {
        return vestedAmount() - released;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function updateBeneficiary(address _beneficiary) external onlyOwner {
        require(_beneficiary != address(0), "Vesting: zero beneficiary");
        emit BeneficiaryUpdated(beneficiary, _beneficiary);
        beneficiary = _beneficiary;
    }
}
