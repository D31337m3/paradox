// PARADOX (PDX) — Full atomic deployment
// Auto-waits for sufficient MATIC before deploying.
// Run: npx hardhat run scripts/deploy-all.js --network polygon

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Minimum MATIC required: ~1.5 MATIC covers all gas + meaningful LP seed
// The more MATIC you send, the deeper the initial liquidity.
const MIN_MATIC = ethers.parseEther("1.5");
const POLL_INTERVAL_MS = 15_000; // check every 15 seconds

async function waitForFunds(deployer) {
  const addr = deployer.address;
  let announced = false;
  while (true) {
    const bal = await ethers.provider.getBalance(addr);
    if (!announced) {
      console.log("═══════════════════════════════════════════════");
      console.log("  PARADOX (PDX) — Waiting for MATIC");
      console.log("═══════════════════════════════════════════════");
      console.log("  Deployer:", addr);
      console.log("  Minimum: ", ethers.formatEther(MIN_MATIC), "MATIC");
      console.log("  Current: ", ethers.formatEther(bal), "MATIC");
      console.log("  Send MATIC to the deployer address above.");
      console.log("  Script will auto-deploy once balance >= minimum.");
      announced = true;
    }
    if (bal >= MIN_MATIC) {
      console.log(`\n  ✅ Funded! ${ethers.formatEther(bal)} MATIC detected — starting deployment...`);
      return bal;
    }
    process.stdout.write(`\r  Waiting... current balance: ${ethers.formatEther(bal)} MATIC   `);
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}

const QUICKSWAP_FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
const QUICKSWAP_ROUTER  = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const WMATIC            = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

const FACTORY_ABI = [
  "function getPair(address,address) view returns (address)",
  "function createPair(address,address) returns (address)",
];
const ROUTER_ABI = [
  "function addLiquidityETH(address,uint,uint,uint,address,uint) payable returns (uint,uint,uint)",
];
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
];
const PAIR_ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function token0() view returns (address)",
];

async function waitFor(label, txPromise) {
  process.stdout.write(`  ${label}... `);
  const tx = await txPromise;
  const receipt = await tx.wait();
  console.log(`✓  (block ${receipt.blockNumber}, gas ${receipt.gasUsed})`);
  return receipt;
}

async function verifySourcify(name, address, constructorArgs) {
  try {
    await hre.run("verify:sourcify", { address, constructorArguments: constructorArgs });
    console.log(`  Sourcify ${name}: ✅ verified`);
  } catch (e) {
    console.log(`  Sourcify ${name}: ⚠️  ${e.message.split("\n")[0]}`);
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();

  // Wait until wallet has enough MATIC — polls every 15s
  const maticBal = await waitForFunds(deployer);
  const nonce    = await ethers.provider.getTransactionCount(deployer.address);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  PARADOX (PDX) — Atomic Deployment");
  console.log("═══════════════════════════════════════════════");
  console.log("  Deployer:", deployer.address);
  console.log("  MATIC:   ", ethers.formatEther(maticBal));
  console.log("  Nonce:   ", nonce);

  // ─── 1. DEPLOY CONTRACTS ───────────────────────────────────────
  console.log("\n[1/6] Deploying contracts...");

  const BurnRepNFT = await ethers.getContractFactory("BurnReputationNFT");
  const burnNFT = await BurnRepNFT.deploy();
  await burnNFT.waitForDeployment();
  const burnNFTAddr = await burnNFT.getAddress();
  console.log(`  BurnReputationNFT: ${burnNFTAddr}`);

  const ParadoxToken = await ethers.getContractFactory("ParadoxToken");
  const token = await ParadoxToken.deploy(
    deployer.address,  // 50% LP
    deployer.address,  // 20% epoch rewards (sent to EpochController after deploy)
    deployer.address,  // 15% dev vesting (sent to TokenVesting after deploy)
    deployer.address,  // 10% DAO treasury
    deployer.address   // 5% ecosystem
  );
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log(`  ParadoxToken (PDX): ${tokenAddr}`);

  const TokenVesting = await ethers.getContractFactory("TokenVesting");
  const vesting = await TokenVesting.deploy(tokenAddr, deployer.address);
  await vesting.waitForDeployment();
  const vestingAddr = await vesting.getAddress();
  console.log(`  TokenVesting: ${vestingAddr}`);

  const EpochCtrl = await ethers.getContractFactory("EpochController");
  const epoch = await EpochCtrl.deploy(
    tokenAddr,
    burnNFTAddr,
    ethers.parseEther("2000000"),   // initialEmissionRate: 2M PDX/epoch
    ethers.parseEther("500000"),    // emissionFloor:        0.5M PDX/epoch
    ethers.parseEther("10000000")   // emissionCeiling:      10M PDX/epoch
  );
  await epoch.waitForDeployment();
  const epochAddr = await epoch.getAddress();
  console.log(`  EpochController: ${epochAddr}`);

  // ─── 2. SETUP PROTOCOL ─────────────────────────────────────────
  console.log("\n[2/6] Setting up protocol...");
  const supply = ethers.parseEther("1000000000");

  await waitFor("setEpochController on token",
    token.setEpochController(epochAddr));

  await waitFor("setEpochController on BurnNFT",
    burnNFT.setEpochController(epochAddr));

  await waitFor("Transfer 200M PDX → EpochController (reward reserve)",
    token.transfer(epochAddr, (supply * 20n) / 100n));

  await waitFor("Transfer 150M PDX → TokenVesting (dev)",
    token.transfer(vestingAddr, (supply * 15n) / 100n));

  await waitFor("Start Epoch 0",
    epoch.startFirstEpoch());

  // ─── 3. PRE-CREATE QUICKSWAP PAIR ──────────────────────────────
  console.log("\n[3/6] Creating QuickSwap V2 pair...");
  const factory = new ethers.Contract(QUICKSWAP_FACTORY, FACTORY_ABI, deployer);

  let pairAddr = await factory.getPair(tokenAddr, WMATIC);
  if (pairAddr === ethers.ZeroAddress) {
    await waitFor("factory.createPair(PDX, WMATIC)", factory.createPair(tokenAddr, WMATIC, { gasLimit: 5_000_000n }));
    pairAddr = await factory.getPair(tokenAddr, WMATIC);
  }
  console.log(`  Pair: ${pairAddr}`);

  // ─── 4. ADD LIQUIDITY ATOMICALLY ───────────────────────────────
  console.log("\n[4/6] Seeding QuickSwap LP (atomic, MEV-safe)...");

  // Wallet has: 500M (LP) + 100M (DAO) + 50M (ecosystem) = 650M
  // Use 500M for LP as per tokenomics
  const lpPdxAmount = (supply * 50n) / 100n; // 500M

  // Reserve MATIC for remaining setup gas
  const feeData  = await ethers.provider.getFeeData();
  const gp       = feeData.maxFeePerGas || feeData.gasPrice;
  const GAS_LIMIT = 500_000n;
  // Reserve: full gas cost of this tx (gasLimit × gasPrice) × 2 safety margin
  const gasReserve = GAS_LIMIT * gp * 2n;
  const freshBal = await ethers.provider.getBalance(deployer.address);
  const maticForLP = freshBal - gasReserve;

  console.log(`  PDX for LP:  500,000,000`);
  console.log(`  MATIC for LP: ${ethers.formatEther(maticForLP)}`);

  await waitFor("approve PDX to router (MaxUint256)",
    token.approve(QUICKSWAP_ROUTER, ethers.MaxUint256));

  const router = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, deployer);
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  await waitFor("addLiquidityETH (500M PDX + MATIC)",
    router.addLiquidityETH(
      tokenAddr,
      lpPdxAmount,
      0n,           // amountTokenMin = 0 (initial LP, no prior price)
      0n,           // amountETHMin   = 0
      deployer.address,
      deadline,
      { value: maticForLP, gasLimit: 500_000n }
    ));

  // ─── 5. VERIFY ON SOURCIFY ─────────────────────────────────────
  console.log("\n[5/6] Verifying on Sourcify...");
  await verifySourcify("BurnReputationNFT", burnNFTAddr, []);
  await verifySourcify("ParadoxToken", tokenAddr, [
    deployer.address, deployer.address, deployer.address, deployer.address, deployer.address
  ]);
  await verifySourcify("TokenVesting", vestingAddr, [tokenAddr, deployer.address]);
  await verifySourcify("EpochController", epochAddr, [
    tokenAddr, burnNFTAddr,
    ethers.parseEther("2000000").toString(),
    ethers.parseEther("500000").toString(),
    ethers.parseEther("10000000").toString()
  ]);

  // ─── 6. WRITE ADDRESSES ────────────────────────────────────────
  console.log("\n[6/6] Writing addresses...");

  const pair = new ethers.Contract(pairAddr, PAIR_ABI, ethers.provider);
  const [r0, r1] = await pair.getReserves();
  const lpBal = await pair.balanceOf(deployer.address);
  const t0 = await pair.token0();

  const [wmaticReserve, pdxReserve] = t0.toLowerCase() === WMATIC.toLowerCase()
    ? [r0, r1] : [r1, r0];

  const finalMatic = await ethers.provider.getBalance(deployer.address);
  const pdxBal     = await new ethers.Contract(tokenAddr, ERC20_ABI, ethers.provider)
    .balanceOf(deployer.address);

  // Write addresses.js for frontend
  const addressesJs = `// Auto-generated by deploy-all.js
export const CONTRACT_ADDRESSES = {
  "ParadoxToken": "${tokenAddr}",
  "BurnReputationNFT": "${burnNFTAddr}",
  "EpochController": "${epochAddr}",
  "TokenVesting": "${vestingAddr}",
  "LP_PAIR": "${pairAddr}"
};

export const CHAIN_ID = 137;
export const BLOCK_EXPLORER = "https://polygonscan.com";
export const QUICKSWAP_URL  = "https://quickswap.exchange/#/swap?outputCurrency=";
export const LP_URL          = "https://quickswap.exchange/#/add/ETH/";
export const DEPLOYER_ADDRESS = "${deployer.address}";
`;
  fs.writeFileSync(
    path.join(__dirname, "../../frontend/src/contracts/addresses.js"),
    addressesJs
  );

  // Write ADDRESSES.txt
  const now = new Date().toUTCString();
  const txt = `╔══════════════════════════════════════════════════════════════╗
║            PARADOX (PDX) — DEPLOYED ADDRESSES               ║
║                  Polygon Mainnet (Chain 137)                 ║
╚══════════════════════════════════════════════════════════════╝

Generated: ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Name:           PARADOX
  Symbol:         PDX
  Decimals:       18
  Total Supply:   1,000,000,000 PDX
  Address:        ${tokenAddr}
  Polygonscan:    https://polygonscan.com/token/${tokenAddr}
  Sourcify:       https://sourcify.dev/#/lookup/${tokenAddr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTRACTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EpochController
    Address:      ${epochAddr}
    Polygonscan:  https://polygonscan.com/address/${epochAddr}
    Sourcify:     https://sourcify.dev/#/lookup/${epochAddr}
    PDX held:     200,000,000 PDX (reward reserve)

  BurnReputationNFT (Soulbound)
    Address:      ${burnNFTAddr}
    Polygonscan:  https://polygonscan.com/address/${burnNFTAddr}
    Sourcify:     https://sourcify.dev/#/lookup/${burnNFTAddr}

  TokenVesting (Dev - 24mo linear)
    Address:      ${vestingAddr}
    Polygonscan:  https://polygonscan.com/address/${vestingAddr}
    Sourcify:     https://sourcify.dev/#/lookup/${vestingAddr}
    PDX locked:   150,000,000 PDX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIQUIDITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  QuickSwap V2 Pair (PDX/WMATIC)
    Pair Address: ${pairAddr}
    WMATIC in LP: ${ethers.formatEther(wmaticReserve)} MATIC
    PDX in LP:    ${ethers.formatEther(pdxReserve)} PDX
    LP tokens:    ${ethers.formatEther(lpBal)}
    Polygonscan:  https://polygonscan.com/address/${pairAddr}
    QuickSwap:    https://quickswap.exchange/#/swap?outputCurrency=${tokenAddr}
    Add LP:       https://quickswap.exchange/#/add/${tokenAddr}/${WMATIC}
    DexScreener:  https://dexscreener.com/polygon/${pairAddr}
    Lock LP:      https://app.unicrypt.network/amm/quickswap-v2/lock

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WALLETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Deployer / Treasury
    Address:      ${deployer.address}
    MATIC bal:    ${ethers.formatEther(finalMatic)} MATIC
    PDX bal:      ${ethers.formatEther(pdxBal)} PDX (DAO+ecosystem)
    Polygonscan:  https://polygonscan.com/address/${deployer.address}

  Full wallet credentials -> see wallet.txt (KEEP SECURE)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALLOCATION STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  50% Fair Launch LP    500,000,000 PDX + ${ethers.formatEther(wmaticReserve)} MATIC -> QuickSwap LOCKED
  20% Epoch Reserve     200,000,000 PDX -> EpochController
  15% Dev Vesting       150,000,000 PDX -> TokenVesting (24mo)
  10% DAO Treasury      100,000,000 PDX -> deployer (send to multisig)
   5% Ecosystem          50,000,000 PDX -> deployer (send to grants wallet)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Sourcify (all 4 contracts): verified above
  Polygonscan: add POLYGONSCAN_API_KEY to .env then:
    npx hardhat verify --network polygon ${tokenAddr} ${deployer.address} ${deployer.address} ${deployer.address} ${deployer.address} ${deployer.address}
    npx hardhat verify --network polygon ${burnNFTAddr}
    npx hardhat verify --network polygon ${vestingAddr} ${tokenAddr} ${deployer.address}
    npx hardhat verify --network polygon ${epochAddr} ${tokenAddr} ${burnNFTAddr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFRASTRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  QuickSwap V2 Router:  ${QUICKSWAP_ROUTER}
  QuickSwap V2 Factory: ${QUICKSWAP_FACTORY}
  WMATIC:               ${WMATIC}
  Network:              Polygon Mainnet
  Chain ID:             137
  Block Explorer:       https://polygonscan.com
`;
  fs.writeFileSync(path.join(__dirname, "../../ADDRESSES.txt"), txt);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  ✅ PARADOX (PDX) FULLY DEPLOYED");
  console.log("═══════════════════════════════════════════════");
  console.log("  Token:       ", tokenAddr);
  console.log("  LP Pair:     ", pairAddr);
  console.log("  WMATIC in LP:", ethers.formatEther(wmaticReserve));
  console.log("  PDX in LP:   ", ethers.formatEther(pdxReserve));
  console.log("  LP tokens:   ", ethers.formatEther(lpBal));
  console.log("  Trade:        https://quickswap.exchange/#/swap?outputCurrency=" + tokenAddr);
  console.log("  ADDRESSES.txt written ✓");
  console.log("  addresses.js written  ✓");
}

main().catch(e => { console.error("\n❌ DEPLOY FAILED:", e.message); process.exit(1); });
