/**
 * transfer-ownership.js
 *
 * Security hardening — removes deployer as single point of control:
 *
 *   ParadoxToken       → renounceOwnership()         (no meaningful owner fns remain)
 *   EpochControllerV2  → transferOwnership(MULTISIG)  (2-of-2 Safe, preserves emergencyWithdraw)
 *   BurnReputationNFTv2→ transferOwnership(MULTISIG)  (preserves seasonal NFT upgrade path)
 *
 * Run:
 *   PRIVATE_KEY=<deployer_key_no_0x> npx hardhat run scripts/transfer-ownership.js --network polygon
 *
 * DRY RUN (no tx sent):
 *   DRY_RUN=true PRIVATE_KEY=... npx hardhat run scripts/transfer-ownership.js --network polygon
 */

const { ethers } = require("hardhat");

// ── Addresses ──────────────────────────────────────────────────────────────
const PARADOX_TOKEN    = "0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09";
const EPOCH_CONTROLLER = "0x473a89EB41D3903f56c054Ef0a16fB8594515e53";
const BURN_NFT         = "0x7c147b31fA9fB4441dA937148E1600A72fa7f88A";
const DAO_MULTISIG     = "0xfed787784C3C3f7101B46f06A847CB5D60Fa6166";
const ZERO_ADDRESS     = "0x0000000000000000000000000000000000000000";

const DRY_RUN = process.env.DRY_RUN === "true";

// Minimal ABIs — only what we need
const OWNABLE_ABI = [
  "function owner() view returns (address)",
  "function renounceOwnership() external",
  "function transferOwnership(address newOwner) external",
];

async function confirm(msg) {
  if (DRY_RUN) { console.log(`  [DRY RUN] would: ${msg}`); return; }
  // In non-interactive mode just proceed; operator confirmed by running the script
  console.log(`  ► ${msg}`);
}

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("\n══════════════════════════════════════════════════════");
  console.log(" PARADOX — Ownership Transfer / Security Hardening");
  console.log("══════════════════════════════════════════════════════");
  console.log(` Signer  : ${signer.address}`);
  console.log(` Network : ${(await ethers.provider.getNetwork()).name}`);
  console.log(` Mode    : ${DRY_RUN ? "DRY RUN (no txs)" : "LIVE"}`);
  console.log("──────────────────────────────────────────────────────\n");

  // ── 1. ParadoxToken — renounceOwnership ────────────────────────────────
  console.log("[1/3] ParadoxToken");
  const token = new ethers.Contract(PARADOX_TOKEN, OWNABLE_ABI, signer);
  const tokenOwner = await token.owner();
  console.log(`      current owner : ${tokenOwner}`);

  if (tokenOwner === ZERO_ADDRESS) {
    console.log("      ✓ Already renounced — skipping\n");
  } else if (tokenOwner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log("      ✗ Signer is not owner — skipping\n");
  } else {
    await confirm("renounceOwnership() on ParadoxToken");
    if (!DRY_RUN) {
      const tx = await token.renounceOwnership();
      console.log(`      tx: ${tx.hash}`);
      await tx.wait();
      console.log("      ✓ Ownership renounced — token is now ownerless\n");
    }
  }

  // ── 2. EpochControllerV2 — transferOwnership(MULTISIG) ─────────────────
  console.log("[2/3] EpochControllerV2");
  const ec = new ethers.Contract(EPOCH_CONTROLLER, OWNABLE_ABI, signer);
  const ecOwner = await ec.owner();
  console.log(`      current owner : ${ecOwner}`);
  console.log(`      new owner     : ${DAO_MULTISIG} (DAO multisig)`);

  if (ecOwner.toLowerCase() === DAO_MULTISIG.toLowerCase()) {
    console.log("      ✓ Already transferred — skipping\n");
  } else if (ecOwner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log("      ✗ Signer is not owner — skipping\n");
  } else {
    await confirm(`transferOwnership(${DAO_MULTISIG}) on EpochControllerV2`);
    if (!DRY_RUN) {
      const tx = await ec.transferOwnership(DAO_MULTISIG);
      console.log(`      tx: ${tx.hash}`);
      await tx.wait();
      console.log("      ✓ EpochController ownership → DAO multisig\n");
    }
  }

  // ── 3. BurnReputationNFTv2 — transferOwnership(MULTISIG) ───────────────
  console.log("[3/3] BurnReputationNFTv2");
  const nft = new ethers.Contract(BURN_NFT, OWNABLE_ABI, signer);
  const nftOwner = await nft.owner();
  console.log(`      current owner : ${nftOwner}`);
  console.log(`      new owner     : ${DAO_MULTISIG} (DAO multisig)`);

  if (nftOwner.toLowerCase() === DAO_MULTISIG.toLowerCase()) {
    console.log("      ✓ Already transferred — skipping\n");
  } else if (nftOwner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log("      ✗ Signer is not owner — skipping\n");
  } else {
    await confirm(`transferOwnership(${DAO_MULTISIG}) on BurnReputationNFTv2`);
    if (!DRY_RUN) {
      const tx = await nft.transferOwnership(DAO_MULTISIG);
      console.log(`      tx: ${tx.hash}`);
      await tx.wait();
      console.log("      ✓ NFT ownership → DAO multisig\n");
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("══════════════════════════════════════════════════════");
  if (!DRY_RUN) {
    console.log(" POST-TX VERIFICATION");
    console.log("──────────────────────────────────────────────────────");
    const [t, e, n] = await Promise.all([token.owner(), ec.owner(), nft.owner()]);
    console.log(` ParadoxToken owner     : ${t} ${t === ZERO_ADDRESS ? "✓ renounced" : ""}`);
    console.log(` EpochController owner  : ${e} ${e.toLowerCase() === DAO_MULTISIG.toLowerCase() ? "✓ DAO multisig" : "⚠ unexpected"}`);
    console.log(` BurnReputationNFT owner: ${n} ${n.toLowerCase() === DAO_MULTISIG.toLowerCase() ? "✓ DAO multisig" : "⚠ unexpected"}`);
  }
  console.log("══════════════════════════════════════════════════════\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
