// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title BurnReputationNFT
/// @notice Soulbound (non-transferable) NFT awarded to PARADOX burners.
///         Each token records: amount burned, epoch number, and conviction tier.
///         Reputation cannot be purchased — only earned through destruction.
contract BurnReputationNFT is ERC721, Ownable {
    enum ConvictionTier { BRONZE, SILVER, GOLD, DIAMOND }

    struct BurnRecord {
        uint256 amountBurned;   // PRDX burned (in wei)
        uint256 epochNumber;    // epoch in which the burn occurred
        ConvictionTier tier;    // derived at mint time
        uint256 reputationScore; // cumulative score for this token
    }

    uint256 public nextTokenId;
    address public epochController;

    mapping(uint256 => BurnRecord) public burnRecords;
    /// @dev cumulative reputation per address (sum of all NFT scores)
    mapping(address => uint256) public reputationOf;

    event Minted(address indexed to, uint256 indexed tokenId, uint256 amountBurned, uint256 epoch, ConvictionTier tier);

    constructor() ERC721("PARADOX Burn Reputation", "PRDX-REP") Ownable(msg.sender) {}

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setEpochController(address _controller) external onlyOwner {
        require(_controller != address(0), "BurnNFT: zero controller");
        epochController = _controller;
    }

    // ─── Minting ──────────────────────────────────────────────────────────────

    /// @notice Minted exclusively by EpochController when a user burns.
    function mint(address to, uint256 amountBurned, uint256 epochNumber) external returns (uint256) {
        require(msg.sender == epochController, "BurnNFT: only epoch controller");
        require(to != address(0), "BurnNFT: zero address");

        ConvictionTier tier = _tier(amountBurned);
        uint256 score      = _score(amountBurned, tier);

        uint256 tokenId = nextTokenId++;
        _safeMint(to, tokenId);

        burnRecords[tokenId] = BurnRecord({
            amountBurned:    amountBurned,
            epochNumber:     epochNumber,
            tier:            tier,
            reputationScore: score
        });

        reputationOf[to] += score;

        emit Minted(to, tokenId, amountBurned, epochNumber, tier);
        return tokenId;
    }

    // ─── Soulbound — block all transfers ──────────────────────────────────────

    function transferFrom(address, address, uint256) public pure override {
        revert("BurnNFT: soulbound - non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("BurnNFT: soulbound - non-transferable");
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    function _tier(uint256 amount) internal pure returns (ConvictionTier) {
        uint256 prdx = amount / 1e18;
        if (prdx >= 100_000) return ConvictionTier.DIAMOND;
        if (prdx >=  10_000) return ConvictionTier.GOLD;
        if (prdx >=   1_000) return ConvictionTier.SILVER;
        return ConvictionTier.BRONZE;
    }

    function _score(uint256 amount, ConvictionTier tier) internal pure returns (uint256) {
        uint256 base = amount / 1e18; // 1 point per PRDX burned
        if (tier == ConvictionTier.DIAMOND) return base * 4;
        if (tier == ConvictionTier.GOLD)    return base * 3;
        if (tier == ConvictionTier.SILVER)  return base * 2;
        return base;
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        BurnRecord memory r = burnRecords[tokenId];
        string memory tierName = _tierName(r.tier);
        return string(abi.encodePacked(
            'data:application/json;utf8,{"name":"PARADOX Burn Rep #', _toString(tokenId),
            '","description":"Earned through destruction. Not purchasable.","attributes":[',
            '{"trait_type":"Epoch","value":', _toString(r.epochNumber), '},',
            '{"trait_type":"PRDX Burned","value":', _toString(r.amountBurned / 1e18), '},',
            '{"trait_type":"Tier","value":"', tierName, '"},',
            '{"trait_type":"Reputation Score","value":', _toString(r.reputationScore), '}]}'
        ));
    }

    function _tierName(ConvictionTier t) internal pure returns (string memory) {
        if (t == ConvictionTier.DIAMOND) return "Diamond";
        if (t == ConvictionTier.GOLD)    return "Gold";
        if (t == ConvictionTier.SILVER)  return "Silver";
        return "Bronze";
    }

    function _toString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 tmp = v; uint256 len;
        while (tmp != 0) { len++; tmp /= 10; }
        bytes memory b = new bytes(len);
        while (v != 0) { b[--len] = bytes1(uint8(48 + v % 10)); v /= 10; }
        return string(b);
    }
}
