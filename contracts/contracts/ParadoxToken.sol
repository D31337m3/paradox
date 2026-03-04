// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PARADOX Token (PRDX)
/// @notice ERC-20 base for the PARADOX behavioral liquidity experiment.
///         1,000,000,000 PRDX minted once at construction. No further minting.
contract ParadoxToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    address public epochController;
    bool public epochControllerSet;

    event EpochControllerSet(address indexed controller);

    constructor(
        address liquidityWallet,   // 50% — fair launch liquidity
        address rewardReserve,     // 20% — epoch reward reserve (-> EpochController)
        address devVesting,        // 15% — dev (TokenVesting contract)
        address daoTreasury,       // 10% — DAO treasury
        address ecosystemGrants    //  5% — ecosystem experimentation grants
    ) ERC20("PARADOX", "PDX") Ownable(msg.sender) {
        require(liquidityWallet  != address(0), "PARADOX: zero liquidity wallet");
        require(rewardReserve    != address(0), "PARADOX: zero reward reserve");
        require(devVesting       != address(0), "PARADOX: zero dev vesting");
        require(daoTreasury      != address(0), "PARADOX: zero DAO treasury");
        require(ecosystemGrants  != address(0), "PARADOX: zero ecosystem grants");

        _mint(liquidityWallet,  (MAX_SUPPLY * 50) / 100); // 500,000,000
        _mint(rewardReserve,    (MAX_SUPPLY * 20) / 100); // 200,000,000
        _mint(devVesting,       (MAX_SUPPLY * 15) / 100); // 150,000,000
        _mint(daoTreasury,      (MAX_SUPPLY * 10) / 100); // 100,000,000
        _mint(ecosystemGrants,  (MAX_SUPPLY *  5) / 100); //  50,000,000
    }

    /// @notice One-time setter — locks in the epoch controller after deployment.
    function setEpochController(address _controller) external onlyOwner {
        require(!epochControllerSet, "PARADOX: controller already set");
        require(_controller != address(0), "PARADOX: zero controller");
        epochController = _controller;
        epochControllerSet = true;
        emit EpochControllerSet(_controller);
    }

    /// @notice Allows the epoch controller to burn tokens on behalf of a user
    ///         (requires the user to have approved the controller).
    function burnFromController(address account, uint256 amount) external {
        require(msg.sender == epochController, "PARADOX: only epoch controller");
        _burn(account, amount);
    }
}
