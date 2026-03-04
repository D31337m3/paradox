// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./SVGGenerator.sol";

/// @title BurnReputationNFTv2
/// @notice Soulbound (non-transferable) NFT awarded when a participant burns PDX in PARADOX.
///
///  Improvements over v1:
///   - Percentage-based tier thresholds (adjustable by owner) — scale with supply, resist inflation
///   - Square-root reputation scoring — 100x more PDX burned = ~10x more score, not 100x
///   - Unique on-chain SVG image per token (deterministic fingerprint from tokenId+amount+epoch)
///   - Full on-chain metadata — no IPFS dependency
contract BurnReputationNFTv2 is ERC721, Ownable {

    enum ConvictionTier { BRONZE, SILVER, GOLD, DIAMOND }

    struct BurnRecord {
        uint256 amountBurned;    // in wei
        uint256 epochNumber;
        ConvictionTier tier;
        uint256 reputationScore;
    }

    uint256 public nextTokenId;
    address public epochController;

    // ── Tier thresholds (owner-adjustable, percentage-of-supply based) ─────────
    // Defaults: Bronze=any, Silver≥0.005% (50K), Gold≥0.05% (500K), Diamond≥0.5% (5M) of 1B supply
    uint256 public tierSilverMin  =   50_000 * 1e18;
    uint256 public tierGoldMin    =  500_000 * 1e18;
    uint256 public tierDiamondMin = 5_000_000 * 1e18;

    mapping(uint256 => BurnRecord) public burnRecords;
    mapping(address => uint256)    public reputationOf;

    event Minted(address indexed to, uint256 indexed tokenId, uint256 amountBurned, uint256 epoch, ConvictionTier tier);
    event TierThresholdsUpdated(uint256 silver, uint256 gold, uint256 diamond);
    event EpochControllerSet(address controller);

    constructor() ERC721("PARADOX Burn Reputation", "PDX-REP") Ownable(msg.sender) {}

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setEpochController(address _controller) external onlyOwner {
        require(_controller != address(0), "BurnNFT: zero address");
        epochController = _controller;
        emit EpochControllerSet(_controller);
    }

    /// @notice Update tier thresholds. Values are in wei (PDX * 1e18).
    ///         Recommend pegging to a % of current circulating supply.
    function setTierThresholds(uint256 silver, uint256 gold, uint256 diamond) external onlyOwner {
        require(silver < gold && gold < diamond, "BurnNFT: thresholds must be ascending");
        tierSilverMin  = silver;
        tierGoldMin    = gold;
        tierDiamondMin = diamond;
        emit TierThresholdsUpdated(silver, gold, diamond);
    }

    // ─── Minting (called by EpochController only) ─────────────────────────────

    function mint(address to, uint256 amountBurned, uint256 epochNumber) external returns (uint256) {
        require(msg.sender == epochController, "BurnNFT: only epoch controller");
        require(to != address(0), "BurnNFT: zero address");

        ConvictionTier tier = _tier(amountBurned);
        uint256 score       = _score(amountBurned, tier);

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
        revert("BurnNFT: soulbound");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("BurnNFT: soulbound");
    }

    // ─── Token URI — fully on-chain SVG ───────────────────────────────────────

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        BurnRecord memory r = burnRecords[tokenId];

        // Generate unique SVG fingerprint image
        string memory svg = SVGGenerator.generate(
            tokenId,
            r.amountBurned,
            r.epochNumber,
            uint8(r.tier),
            r.reputationScore
        );

        string memory image = string(abi.encodePacked(
            "data:image/svg+xml;base64,",
            Base64.encode(bytes(svg))
        ));

        bytes memory attrA = abi.encodePacked(
            '[{"trait_type":"Epoch","value":', _u(r.epochNumber), '},',
            '{"trait_type":"PDX Burned","value":', _u(r.amountBurned / 1e18), '},',
            '{"trait_type":"Tier","value":"', _tierName(r.tier), '"},'
        );
        bytes memory attrB = abi.encodePacked(
            '{"trait_type":"Reputation Score","value":', _u(r.reputationScore), '}]'
        );

        bytes memory json = abi.encodePacked(
            '{"name":"PDX-REP #', _u(tokenId),
            '","description":"PARADOX Burn Reputation - earned through destruction, not purchase. Soulbound forever.",',
            '"image":"', image, '",',
            '"attributes":', attrA, attrB,
            "}"
        );

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(json)
        ));
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _tier(uint256 amount) internal view returns (ConvictionTier) {
        if (amount >= tierDiamondMin) return ConvictionTier.DIAMOND;
        if (amount >= tierGoldMin)    return ConvictionTier.GOLD;
        if (amount >= tierSilverMin)  return ConvictionTier.SILVER;
        return ConvictionTier.BRONZE;
    }

    /// @notice score = sqrt(PDX_burned) * tier_multiplier
    ///         Square-root scaling: 100x more burned → ~10x more score (not 100x).
    ///         Prevents whales from trivially dominating reputation leaderboards.
    function _score(uint256 amount, ConvictionTier tier) internal pure returns (uint256) {
        uint256 base = _sqrt(amount / 1e18);
        if (tier == ConvictionTier.DIAMOND) return base * 4;
        if (tier == ConvictionTier.GOLD)    return base * 3;
        if (tier == ConvictionTier.SILVER)  return base * 2;
        return base;
    }

    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) { y = z; z = (x / z + z) / 2; }
        return y;
    }

    function _tierName(ConvictionTier t) internal pure returns (string memory) {
        if (t == ConvictionTier.DIAMOND) return "Diamond";
        if (t == ConvictionTier.GOLD)    return "Gold";
        if (t == ConvictionTier.SILVER)  return "Silver";
        return "Bronze";
    }

    function _u(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 tmp = v; uint256 len;
        while (tmp != 0) { len++; tmp /= 10; }
        bytes memory b = new bytes(len);
        while (v != 0) { b[--len] = bytes1(uint8(48 + v % 10)); v /= 10; }
        return string(b);
    }
}
