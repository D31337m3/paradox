require("dotenv").config();
const hre = require("hardhat");
const { ethers } = hre;

// ── Sourcify verification helper ───────────────────────────────────────────────
async function verifySourcify(name, address, constructorArgs = []) {
  console.log(`   🔍 Verifying ${name} on Sourcify...`);
  try {
    await hre.run("verify:sourcify", { address, constructorArguments: constructorArgs });
    console.log(`   ✅ ${name} verified on Sourcify`);
  } catch (e) {
    // Already verified or minor issue — non-fatal
    if (e.message?.includes("already verified") || e.message?.includes("Already verified")) {
      console.log(`   ✓  ${name} already verified on Sourcify`);
    } else {
      console.warn(`   ⚠️  Sourcify verification skipped for ${name}: ${e.message}`);
    }
  }
}

/**
 * PARADOX Deployment Script — Polygon Mainnet
 *
 * Deployment order:
 *  1. BurnReputationNFT
 *  2. TokenVesting  (dev wallet, 24-month linear)
 *  3. ParadoxToken  (mints all allocations)
 *  4. EpochController
 *  5. Wire contracts together
 *  6. Transfer reward reserve (20%) from deployer → EpochController
 *  7. Start epoch 0
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🔮 PARADOX Deployment — Polygon Mainnet");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC\n");

  // ── Wallet addresses (from .env or override here) ──────────────────────────
  const LIQUIDITY_WALLET  = process.env.LIQUIDITY_WALLET  || deployer.address;
  const DEV_WALLET        = process.env.DEV_WALLET        || deployer.address;
  const DAO_TREASURY      = process.env.DAO_TREASURY      || deployer.address;
  const ECOSYSTEM_GRANTS  = process.env.ECOSYSTEM_GRANTS  || deployer.address;

  // ── Initial emission config ─────────────────────────────────────────────────
  // Reward reserve = 200,000,000 PRDX
  // Initial epoch emission = 1% of reserve = 2,000,000 PRDX
  const REWARD_RESERVE  = ethers.parseEther("200000000");
  const INIT_EMISSION   = ethers.parseEther("2000000");   // 1% of reserve
  const EMISSION_FLOOR  = ethers.parseEther("500000");    // 0.25% of reserve
  const EMISSION_CEIL   = ethers.parseEther("10000000");  // 5% of reserve

  // ── 1. BurnReputationNFT ────────────────────────────────────────────────────
  console.log("1️⃣  Deploying BurnReputationNFT...");
  const NFT = await ethers.getContractFactory("BurnReputationNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  console.log("   BurnReputationNFT:", await nft.getAddress());
  await verifySourcify("BurnReputationNFT", await nft.getAddress());

  // ── 2. TokenVesting ─────────────────────────────────────────────────────────
  console.log("2️⃣  Deploying TokenVesting (dev wallet)...");
  // We need token address first — deploy vesting after token with a placeholder,
  // then set token. For simplicity: deploy vesting without token, set it after.
  // Using a factory that accepts token in a setToken call, OR deploy token first
  // with deployer as devVesting and transfer manually.
  //
  // APPROACH: deployer receives the 15% dev alloc, then we deploy vesting, then transfer.
  // This avoids a circular dependency.
  //
  // TokenVesting will be funded after token deploy.

  // ── 3. ParadoxToken ─────────────────────────────────────────────────────────
  console.log("3️⃣  Deploying ParadoxToken...");
  // deployer receives: rewardReserve (20%) and devVesting (15%) temporarily
  const Token = await ethers.getContractFactory("ParadoxToken");
  const token = await Token.deploy(
    LIQUIDITY_WALLET,   // 50%  → liquidity wallet / LP lock
    deployer.address,   // 20%  → deployer, moved to EpochController below
    deployer.address,   // 15%  → deployer, moved to vesting contract below
    DAO_TREASURY,       // 10%  → DAO treasury multisig
    ECOSYSTEM_GRANTS    //  5%  → ecosystem grants wallet
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("   ParadoxToken:", tokenAddress);
  await verifySourcify("ParadoxToken", tokenAddress, [
    LIQUIDITY_WALLET, deployer.address, deployer.address, DAO_TREASURY, ECOSYSTEM_GRANTS,
  ]);

  // ── 4. TokenVesting ─────────────────────────────────────────────────────────
  const Vesting = await ethers.getContractFactory("TokenVesting");
  const vesting = await Vesting.deploy(tokenAddress, DEV_WALLET);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("   TokenVesting:", vestingAddress);
  await verifySourcify("TokenVesting", vestingAddress, [tokenAddress, DEV_WALLET]);

  // ── 5. EpochController ──────────────────────────────────────────────────────
  console.log("4️⃣  Deploying EpochController...");
  const EC = await ethers.getContractFactory("EpochController");
  const ec = await EC.deploy(tokenAddress, await nft.getAddress(), INIT_EMISSION, EMISSION_FLOOR, EMISSION_CEIL);
  await ec.waitForDeployment();
  const ecAddress = await ec.getAddress();
  console.log("   EpochController:", ecAddress);
  await verifySourcify("EpochController", ecAddress, [
    tokenAddress, await nft.getAddress(), INIT_EMISSION, EMISSION_FLOOR, EMISSION_CEIL,
  ]);

  // ── 6. Wire contracts ───────────────────────────────────────────────────────
  console.log("5️⃣  Wiring contracts...");
  await (await token.setEpochController(ecAddress)).wait();
  console.log("   ParadoxToken.epochController set ✓");

  await (await nft.setEpochController(ecAddress)).wait();
  console.log("   BurnReputationNFT.epochController set ✓");

  // ── 7. Fund EpochController with reward reserve ─────────────────────────────
  console.log("6️⃣  Transferring reward reserve to EpochController...");
  await (await token.transfer(ecAddress, REWARD_RESERVE)).wait();
  console.log("   200,000,000 PRDX → EpochController ✓");

  // ── 8. Fund vesting contract with dev allocation ─────────────────────────────
  console.log("7️⃣  Transferring dev allocation to TokenVesting...");
  const devAlloc = ethers.parseEther("150000000");
  await (await token.transfer(vestingAddress, devAlloc)).wait();
  console.log("   150,000,000 PRDX → TokenVesting ✓");

  // ── 9. Start epoch 0 ────────────────────────────────────────────────────────
  console.log("8️⃣  Starting Epoch 0...");
  await (await ec.startFirstEpoch()).wait();
  console.log("   Epoch 0 started ✓");

  // ── Summary ─────────────────────────────────────────────────────────────────
  const addresses = {
    ParadoxToken:      tokenAddress,
    BurnReputationNFT: await nft.getAddress(),
    EpochController:   ecAddress,
    TokenVesting:      vestingAddress,
  };

  console.log("\n✅  PARADOX Deployment Complete");
  console.log("─".repeat(50));
  console.log(JSON.stringify(addresses, null, 2));
  console.log("─".repeat(50));
  console.log("\n⚡  Next steps:");
  console.log("   1. Verify on Polygonscan:");
  Object.entries(addresses).forEach(([name, addr]) =>
    console.log(`      npx hardhat verify --network polygon ${addr}`)
  );
  console.log("   2. Lock liquidity on QuickSwap / Unicrypt");
  console.log("   3. Update frontend/src/contracts/addresses.js with above addresses");
  console.log("   4. Recommend independent audit before advertising broadly\n");

  // Write addresses to file for frontend
  const fs = require("fs");
  const out = `// Auto-generated by deploy.js — update after each deployment
export const CONTRACT_ADDRESSES = ${JSON.stringify(addresses, null, 2)};
`;
  fs.writeFileSync("../frontend/src/contracts/addresses.js", out);
  console.log("   addresses.js written to frontend/src/contracts/ ✓");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
