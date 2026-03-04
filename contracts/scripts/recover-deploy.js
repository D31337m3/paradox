/**
 * PARADOX Recovery Deploy Script
 * Picks up from the confirmed on-chain state:
 *   ✓ nonce 0  BurnReputationNFT → 0xEFD4F48F64934A336Ca87D3a058fE3cBc3fd960D
 *   ✓ nonce 1  ParadoxToken      → 0x7419Bb73fc3890fA11f71B69381633Be983B44a7
 *   ✗ nonce 2  cancelled (self-transfer)
 *   ✗ nonce 3  duplicate NFT (ignored)
 *
 * This script deploys TokenVesting + EpochController, wires everything,
 * transfers allocations, starts Epoch 0, and verifies on Sourcify.
 */
require("dotenv").config();
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");

// ── Already-confirmed contracts ────────────────────────────────────────────────
const BURN_NFT_ADDRESS   = "0xEFD4F48F64934A336Ca87D3a058fE3cBc3fd960D";
const TOKEN_ADDRESS      = "0x7419Bb73fc3890fA11f71B69381633Be983B44a7";

// ── Sourcify helper ────────────────────────────────────────────────────────────
async function verifySourcify(name, address, constructorArgs = []) {
  console.log(`   🔍 Verifying ${name} on Sourcify...`);
  try {
    await hre.run("verify:sourcify", { address, constructorArguments: constructorArgs });
    console.log(`   ✅ ${name} verified → https://sourcify.dev/#/lookup/${address}`);
  } catch (e) {
    if (e.message?.includes("already verified") || e.message?.includes("Already verified")) {
      console.log(`   ✓  Already verified → https://sourcify.dev/#/lookup/${address}`);
    } else {
      console.warn(`   ⚠️  Sourcify skipped: ${e.message}`);
    }
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance    = await ethers.provider.getBalance(deployer.address);
  console.log("\n🔮 PARADOX Recovery Deployment — Polygon Mainnet");
  console.log("Deployer:", deployer.address);
  console.log("Balance: ", ethers.formatEther(balance), "MATIC\n");

  const LIQUIDITY_WALLET = process.env.LIQUIDITY_WALLET || deployer.address;
  const DEV_WALLET       = process.env.DEV_WALLET       || deployer.address;
  const DAO_TREASURY     = process.env.DAO_TREASURY     || deployer.address;
  const ECOSYSTEM_GRANTS = process.env.ECOSYSTEM_GRANTS || deployer.address;

  const REWARD_RESERVE = ethers.parseEther("200000000");
  const DEV_ALLOC      = ethers.parseEther("150000000");
  const INIT_EMISSION  = ethers.parseEther("2000000");
  const EMISSION_FLOOR = ethers.parseEther("500000");
  const EMISSION_CEIL  = ethers.parseEther("10000000");

  // ── Attach to already-deployed contracts ──────────────────────────────────
  const NFT   = await ethers.getContractFactory("BurnReputationNFT");
  const Token = await ethers.getContractFactory("ParadoxToken");
  const nft   = NFT.attach(BURN_NFT_ADDRESS);
  const token = Token.attach(TOKEN_ADDRESS);
  console.log("✓  BurnReputationNFT:", BURN_NFT_ADDRESS);
  console.log("✓  ParadoxToken:     ", TOKEN_ADDRESS, "\n");

  // ── 1. Deploy TokenVesting ────────────────────────────────────────────────
  console.log("1️⃣  Deploying TokenVesting...");
  const Vesting = await ethers.getContractFactory("TokenVesting");
  const vesting = await Vesting.deploy(TOKEN_ADDRESS, DEV_WALLET);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("   TokenVesting:", vestingAddress);
  await verifySourcify("TokenVesting", vestingAddress, [TOKEN_ADDRESS, DEV_WALLET]);

  // ── 2. Deploy EpochController ─────────────────────────────────────────────
  console.log("\n2️⃣  Deploying EpochController...");
  const EC = await ethers.getContractFactory("EpochController");
  const ec = await EC.deploy(TOKEN_ADDRESS, BURN_NFT_ADDRESS, INIT_EMISSION, EMISSION_FLOOR, EMISSION_CEIL);
  await ec.waitForDeployment();
  const ecAddress = await ec.getAddress();
  console.log("   EpochController:", ecAddress);
  await verifySourcify("EpochController", ecAddress, [
    TOKEN_ADDRESS, BURN_NFT_ADDRESS, INIT_EMISSION, EMISSION_FLOOR, EMISSION_CEIL,
  ]);

  // ── 3. Verify already-deployed contracts on Sourcify too ─────────────────
  console.log("\n3️⃣  Verifying pre-deployed contracts on Sourcify...");
  await verifySourcify("BurnReputationNFT", BURN_NFT_ADDRESS, []);
  await verifySourcify("ParadoxToken", TOKEN_ADDRESS, [
    LIQUIDITY_WALLET, deployer.address, deployer.address, DAO_TREASURY, ECOSYSTEM_GRANTS,
  ]);

  // ── 4. Wire contracts ─────────────────────────────────────────────────────
  console.log("\n4️⃣  Wiring contracts...");
  const tx1 = await token.setEpochController(ecAddress);
  await tx1.wait();
  console.log("   ParadoxToken.epochController set ✓");

  const tx2 = await nft.setEpochController(ecAddress);
  await tx2.wait();
  console.log("   BurnReputationNFT.epochController set ✓");

  // ── 5. Fund EpochController ───────────────────────────────────────────────
  console.log("\n5️⃣  Transferring reward reserve → EpochController...");
  const tx3 = await token.transfer(ecAddress, REWARD_RESERVE);
  await tx3.wait();
  console.log("   200,000,000 PRDX → EpochController ✓");

  // ── 6. Fund TokenVesting ──────────────────────────────────────────────────
  console.log("\n6️⃣  Transferring dev allocation → TokenVesting...");
  const tx4 = await token.transfer(vestingAddress, DEV_ALLOC);
  await tx4.wait();
  console.log("   150,000,000 PRDX → TokenVesting ✓");

  // ── 7. Start Epoch 0 ──────────────────────────────────────────────────────
  console.log("\n7️⃣  Starting Epoch 0...");
  const tx5 = await ec.startFirstEpoch();
  await tx5.wait();
  console.log("   Epoch 0 started ✓");

  // ── Summary ───────────────────────────────────────────────────────────────
  const addresses = {
    ParadoxToken:      TOKEN_ADDRESS,
    BurnReputationNFT: BURN_NFT_ADDRESS,
    EpochController:   ecAddress,
    TokenVesting:      vestingAddress,
  };

  console.log("\n✅  PARADOX Fully Deployed");
  console.log("─".repeat(60));
  console.log(JSON.stringify(addresses, null, 2));
  console.log("─".repeat(60));
  console.log("\n🔗 Sourcify links:");
  Object.entries(addresses).forEach(([name, addr]) =>
    console.log(`   ${name}: https://sourcify.dev/#/lookup/${addr}`)
  );
  console.log("\n🔗 Polygonscan:");
  console.log(`   Token: https://polygonscan.com/token/${TOKEN_ADDRESS}`);
  console.log(`   EpochController: https://polygonscan.com/address/${ecAddress}`);

  // Write addresses to frontend
  const out = `// Auto-generated by recover-deploy.js\nexport const CONTRACT_ADDRESSES = ${JSON.stringify(addresses, null, 2)};\n\nexport const CHAIN_ID = 137;\nexport const BLOCK_EXPLORER = "https://polygonscan.com";\nexport const QUICKSWAP_URL  = "https://quickswap.exchange/#/swap?outputCurrency=";\nexport const LP_URL          = "https://quickswap.exchange/#/add/ETH/";\nexport const DEPLOYER_ADDRESS = "${deployer.address}";\n`;
  fs.writeFileSync("../frontend/src/contracts/addresses.js", out);
  console.log("\n📝 addresses.js written to frontend/src/contracts/ ✓");
  console.log("\n⚡ Next steps:");
  console.log("   1. cd frontend && npm run build");
  console.log("   2. Deploy frontend to Vercel / Netlify / IPFS");
  console.log("   3. Lock liquidity on Unicrypt");
  console.log("   4. Add Polygonscan API key to .env and run: npx hardhat verify --network polygon\n");
}

main().catch(e => { console.error(e); process.exit(1); });
