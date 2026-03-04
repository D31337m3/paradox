// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title  ParadoxLog
/// @notice Permanent on-chain archive of the PARADOX community experiment.
///         Every message logged here is immutable, censorship-resistant, and
///         permanently readable from the Polygon blockchain.
///
///         Two paths to permanence:
///           log()          — anyone pays gas to inscribe their own message
///           archiveBatch() — owner snapshots off-chain chat history on-chain
contract ParadoxLog is Ownable {

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted for every on-chain inscription. The event log IS the archive.
    event MessageLogged(
        uint256 indexed id,
        address indexed sender,
        string  room,
        string  text,
        uint256 ts
    );

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public totalLogs;

    // ─── Public write ─────────────────────────────────────────────────────────

    /// @notice Permanently inscribe a message onto the Polygon blockchain.
    /// @param  room  Chat room identifier ("general", "hoard", "burn", "exit")
    /// @param  text  Message content — max 500 chars
    function log(string calldata room, string calldata text) external {
        require(bytes(text).length > 0,   "empty message");
        require(bytes(text).length <= 500, "message too long");
        require(bytes(room).length > 0,   "empty room");
        emit MessageLogged(totalLogs++, msg.sender, room, text, block.timestamp);
    }

    // ─── Owner archive ────────────────────────────────────────────────────────

    /// @notice Batch-archive historical off-chain chat messages on-chain.
    ///         Preserves original sender, room, text, and timestamp.
    ///         Can only be called by the contract owner.
    /// @param  senders     Original message authors
    /// @param  rooms       Room identifiers
    /// @param  texts       Message contents
    /// @param  timestamps  Original Unix timestamps
    function archiveBatch(
        address[] calldata senders,
        string[]  calldata rooms,
        string[]  calldata texts,
        uint256[] calldata timestamps
    ) external onlyOwner {
        uint256 len = senders.length;
        require(len == rooms.length && len == texts.length && len == timestamps.length, "length mismatch");
        require(len <= 200, "max 200 per batch");
        for (uint256 i = 0; i < len; i++) {
            emit MessageLogged(totalLogs++, senders[i], rooms[i], texts[i], timestamps[i]);
        }
    }

    constructor() Ownable(msg.sender) {}
}
