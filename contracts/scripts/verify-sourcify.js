/**
 * PARADOX Sourcify Verification Script
 * Run after deployment if verification was skipped or needs retrying.
 *
 * Usage:
 *   node scripts/verify-sourcify.js
 *
 * Reads addresses from frontend/src/contracts/addresses.js
 */
require("dotenv").config();
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function verify(name, address, args = []) {
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    console.log(`⏭️  Skipping ${name} — address not set`);
    return;
  }
  console.log(`\n🔍 Verifying ${name}`);
  console.log(`   Address: ${address}`);
  try {
    await hre.run("verify:sourcify", { address, constructorArguments: args });
    console.log(`   ✅ Verified on Sourcify`);
    console.log(`   🔗 https://sourcify.dev/#/lookup/${address}`);
  } catch (e) {
    if (e.message?.includes("already verified") || e.message?.includes("Already verified")) {
      console.log(`   ✓  Already verified`);
      console.log(`   🔗 https://sourcify.dev/#/lookup/${address}`);
    } else {
      console.error(`   ❌ Failed: ${e.message}`);
    }
  }
}

async function main() {
  // Load deployed addresses
  const addrFile = path.resolve(__dirname, "../../frontend/src/contracts/addresses.js");
  const raw = fs.readFileSync(addrFile, "utf8");
  const match = raw.match(/CONTRACT_ADDRESSES\s*=\s*(\{[\s\S]*?\})/);
  if (!match) throw new Error("Could not parse addresses.js");
  // eslint-disable-next-line no-eval
  const addrs = eval("(" + match[1] + ")");

  const [deployer] = await ethers.getSigners();
  const LIQUIDITY_WALLET = process.env.LIQUIDITY_WALLET || deployer.address;
  const DEV_WALLET       = process.env.DEV_WALLET       || deployer.address;
  const DAO_TREASURY     = process.env.DAO_TREASURY     || deployer.address;
  const ECOSYSTEM_GRANTS = process.env.ECOSYSTEM_GRANTS || deployer.address;

  const INIT_EMISSION  = ethers.parseEther("2000000");
  const EMISSION_FLOOR = ethers.parseEther("500000");
  const EMISSION_CEIL  = ethers.parseEther("10000000");

  console.log("\n🔮 PARADOX — Sourcify Verification");
  console.log("Network: Polygon Mainnet (137)");
  console.log("─".repeat(50));

  await verify("BurnReputationNFT", addrs.BurnReputationNFT, []);
  await verify("ParadoxToken",      addrs.ParadoxToken,      [
    LIQUIDITY_WALLET, deployer.address, deployer.address, DAO_TREASURY, ECOSYSTEM_GRANTS,
  ]);
  await verify("TokenVesting",      addrs.TokenVesting,      [addrs.ParadoxToken, DEV_WALLET]);
  await verify("EpochController",   addrs.EpochController,   [
    addrs.ParadoxToken, addrs.BurnReputationNFT, INIT_EMISSION, EMISSION_FLOOR, EMISSION_CEIL,
  ]);

  console.log("\n─".repeat(50));
  console.log("✅ Verification complete");
  console.log("\nView all contracts on Sourcify:");
  Object.entries(addrs).forEach(([name, addr]) => {
    if (addr !== "0x0000000000000000000000000000000000000000") {
      console.log(`  ${name}: https://sourcify.dev/#/lookup/${addr}`);
    }
  });
}

main().catch(e => { console.error(e); process.exit(1); });
