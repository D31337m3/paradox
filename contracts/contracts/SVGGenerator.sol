// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SVGGenerator
/// @notice Generates a unique on-chain SVG "digital fingerprint" for each PARADOX Burn Reputation NFT.
///         The visual is deterministically derived from tokenId + amountBurned + epochNumber —
///         making every NFT provably unique and unfakeable.
///         Includes: 9 seed-warped ellipse rings, Polygon network logo, PARADOX branding, tier stats.
library SVGGenerator {

    // ─── Public entry ─────────────────────────────────────────────────────────

    function generate(
        uint256 tokenId,
        uint256 amountBurned,   // wei
        uint256 epochNumber,
        uint8   tier,           // 0=Bronze 1=Silver 2=Gold 3=Diamond
        uint256 repScore
    ) internal pure returns (string memory) {
        bytes32 seed = keccak256(abi.encodePacked(tokenId, amountBurned, epochNumber));
        return string(abi.encodePacked(
            _open(),
            _defs(_col(tier)),
            _bg(_col(tier)),
            _rings(seed, _col(tier)),
            _center(_col(tier)),
            _logo(),
            _panel(_col(tier), _name(tier), tokenId, amountBurned / 1e18, epochNumber, repScore),
            "</svg>"
        ));
    }

    // ─── SVG sections ─────────────────────────────────────────────────────────

    function _open() private pure returns (bytes memory) {
        return bytes('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">');
    }

    function _defs(string memory /* col */) private pure returns (bytes memory) {
        bytes memory a = abi.encodePacked(
            "<defs>",
            '<radialGradient id="bg" cx="50%" cy="42%" r="62%">',
            '<stop offset="0%" stop-color="#0f0f2e"/>',
            '<stop offset="100%" stop-color="#040408"/>',
            "</radialGradient>",
            '<filter id="gw" x="-60%" y="-60%" width="220%" height="220%">',
            '<feGaussianBlur stdDeviation="4" result="b"/>',
            "<feMerge><feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge>",
            "</filter>"
        );
        bytes memory b = abi.encodePacked(
            '<pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">',
            '<circle cx="10" cy="10" r="0.7" fill="#fff" opacity="0.07"/>',
            "</pattern>",
            '<clipPath id="fp"><rect x="8" y="8" width="484" height="358"/></clipPath>',
            "</defs>"
        );
        // suppress unused col warning — col used in border below
        return abi.encodePacked(a, b);
    }

    function _bg(string memory col) private pure returns (bytes memory) {
        return abi.encodePacked(
            '<rect width="500" height="500" fill="url(#bg)"/>',
            '<rect width="500" height="500" fill="url(#dots)"/>',
            '<rect x="3" y="3" width="494" height="494" rx="16" fill="none" stroke="',
            col, '" stroke-width="2" opacity="0.55"/>',
            '<rect x="7" y="7" width="486" height="486" rx="13" fill="none" stroke="',
            col, '" stroke-width="0.5" opacity="0.18"/>'
        );
    }

    /// @dev 9 ellipses whose rx, ry, and rotation are seeded from keccak hash bytes.
    ///      Each NFT produces a visually distinct fingerprint pattern.
    function _rings(bytes32 seed, string memory col) private pure returns (bytes memory) {
        bytes memory el;
        for (uint256 i = 0; i < 9; i++) {
            uint256 b0  = uint256(uint8(seed[i * 3]));
            uint256 b1  = uint256(uint8(seed[i * 3 + 1]));
            uint256 b2  = uint256(uint8(seed[i * 3 + 2]));
            uint256 rx  = 18 + i * 18 + b0 % 14;           // 18-31 → 162-175
            uint256 ry  = rx * (48 + b1 % 40) / 100;       // 48-87% of rx
            uint256 rot = b2 * 179 / 255;                   // 0-179 degrees
            uint256 op  = 70 - i * 7;                       // 70,63,56…14  →  "0.70"→"0.14"
            el = abi.encodePacked(
                el,
                '<ellipse cx="250" cy="205" rx="', _u(rx),
                '" ry="', _u(ry),
                '" fill="none" stroke="', col,
                '" stroke-width="1.3" opacity="0.', _u(op),
                '" transform="rotate(', _u(rot), ' 250 205)"/>'
            );
        }
        return abi.encodePacked('<g clip-path="url(#fp)">', el, "</g>");
    }

    function _center(string memory col) private pure returns (bytes memory) {
        return abi.encodePacked(
            '<circle cx="250" cy="205" r="3" fill="', col, '" filter="url(#gw)"/>',
            '<circle cx="250" cy="205" r="8" fill="none" stroke="', col,
            '" stroke-width="0.9" opacity="0.45"/>'
        );
    }

    /// @dev Simplified Polygon network logo — hexagonal badge with inner diamond + P glyph.
    function _logo() private pure returns (bytes memory) {
        bytes memory outer = abi.encodePacked(
            '<g transform="translate(416,16)" opacity="0.93">',
            '<polygon points="28,0 56,16 56,48 28,64 0,48 0,16" ',
            'fill="#8247E5" fill-opacity="0.15" stroke="#8247E5" stroke-width="2.5"/>'
        );
        bytes memory inner = abi.encodePacked(
            '<polygon points="28,14 43,23 43,41 28,50 13,41 13,23" fill="#8247E5" fill-opacity="0.28"/>',
            '<text x="28" y="40" text-anchor="middle" font-family="Arial,sans-serif" ',
            'font-size="20" font-weight="bold" fill="#8247E5">P</text>',
            '<text x="28" y="78" text-anchor="middle" font-family="Arial,sans-serif" ',
            'font-size="7.5" fill="#8247E5" letter-spacing="2" opacity="0.85">POLYGON</text>',
            "</g>"
        );
        return abi.encodePacked(outer, inner);
    }

    function _panel(
        string memory col,
        string memory tierName,
        uint256 tokenId,
        uint256 pdx,
        uint256 epoch,
        uint256 score
    ) private pure returns (bytes memory) {
        bytes memory top = abi.encodePacked(
            '<line x1="30" y1="376" x2="470" y2="376" stroke="', col, '" stroke-width="0.7" opacity="0.4"/>',
            '<text x="250" y="412" text-anchor="middle" font-family="Courier New,monospace" ',
            'font-size="30" font-weight="bold" fill="white" letter-spacing="10" filter="url(#gw)">PARADOX</text>',
            '<text x="250" y="428" text-anchor="middle" font-family="Courier New,monospace" ',
            'font-size="8.5" fill="', col, '" letter-spacing="4">BURN REPUTATION NFT</text>'
        );
        bytes memory badge = abi.encodePacked(
            '<rect x="178" y="435" width="144" height="23" rx="11.5" fill="', col, '" fill-opacity="0.12"/>',
            '<rect x="178" y="435" width="144" height="23" rx="11.5" fill="none" stroke="',
            col, '" stroke-width="1.2" opacity="0.65"/>',
            '<text x="250" y="451" text-anchor="middle" font-family="Courier New,monospace" ',
            'font-size="11" font-weight="bold" fill="', col, '" letter-spacing="4">', tierName, '</text>'
        );
        bytes memory stats = abi.encodePacked(
            '<line x1="30" y1="464" x2="470" y2="464" stroke="', col, '" stroke-width="0.4" opacity="0.2"/>',
            _stat("83",  "477", "491", "EPOCH",      _u(epoch), col),
            _stat("250", "477", "491", "PDX BURNED", _fmt(pdx),  col),
            _stat("417", "477", "491", "REP SCORE",  _u(score),  col),
            '<text x="250" y="499" text-anchor="middle" font-family="Courier New,monospace" ',
            'font-size="9" fill="#555" letter-spacing="2">PDX-REP #', _u(tokenId), "</text>"
        );
        return abi.encodePacked(top, badge, stats);
    }

    function _stat(
        string memory x,
        string memory y1,
        string memory y2,
        string memory label,
        string memory val,
        string memory col
    ) private pure returns (bytes memory) {
        return abi.encodePacked(
            '<text x="', x, '" y="', y1,
            '" text-anchor="middle" font-family="Courier New,monospace" font-size="7" fill="#666" letter-spacing="1">',
            label, "</text>",
            '<text x="', x, '" y="', y2,
            '" text-anchor="middle" font-family="Courier New,monospace" font-size="11" font-weight="bold" fill="',
            col, '">', val, "</text>"
        );
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    function _col(uint8 t) private pure returns (string memory) {
        if (t == 3) return "#00e5ff";  // Diamond — cyan
        if (t == 2) return "#ffd700";  // Gold    — yellow
        if (t == 1) return "#b0b8c8";  // Silver  — slate
        return "#cd7f32";               // Bronze  — bronze
    }

    function _name(uint8 t) private pure returns (string memory) {
        if (t == 3) return "DIAMOND";
        if (t == 2) return "GOLD";
        if (t == 1) return "SILVER";
        return "BRONZE";
    }

    function _fmt(uint256 n) private pure returns (string memory) {
        if (n >= 1_000_000) return string(abi.encodePacked(_u(n / 1_000_000), "M"));
        if (n >= 1_000)     return string(abi.encodePacked(_u(n / 1_000),     "K"));
        return _u(n);
    }

    function _u(uint256 v) private pure returns (string memory) {
        if (v == 0) return "0";
        uint256 tmp = v;
        uint256 len;
        while (tmp != 0) { len++; tmp /= 10; }
        bytes memory b = new bytes(len);
        while (v != 0) { b[--len] = bytes1(uint8(48 + v % 10)); v /= 10; }
        return string(b);
    }
}
