// Safe LP add via addLiquidityETH (atomic, MEV-safe)
// Run: npx hardhat run scripts/add-liquidity-safe.js --network polygon
const { ethers } = require("hardhat");

const TOKEN  = "0x7419Bb73fc3890fA11f71B69381633Be983B44a7";
const ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const FACTORY= "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
const WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
const PAIR   = "0x12CaCb83FfDdc235eCc7a9e4bd32f3A7cD15f0Dd";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
];
const ROUTER_ABI = [
  "function addLiquidityETH(address,uint,uint,uint,address,uint) payable returns (uint,uint,uint)",
];
const PAIR_ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

async function main() {
  const [deployer] = await ethers.getSigners();
  const maticBal = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address);
  console.log("MATIC balance:", ethers.formatEther(maticBal));

  const token = new ethers.Contract(TOKEN, ERC20_ABI, deployer);
  const prdxBal = await token.balanceOf(deployer.address);
  console.log("PRDX balance:", ethers.formatEther(prdxBal));

  if (prdxBal === 0n) throw new Error("No PRDX in deployer wallet");

  const feeData = await ethers.provider.getFeeData();
  const gp = feeData.maxFeePerGas || feeData.gasPrice;
  const GAS_LIMIT = 400_000n;
  const gasReserve = GAS_LIMIT * gp + ethers.parseEther("0.01");
  const maticForLP = maticBal - gasReserve;

  if (maticForLP <= 0n) throw new Error(`Not enough MATIC. Have ${ethers.formatEther(maticBal)}, need at least ${ethers.formatEther(gasReserve)}`);

  console.log("\nAdding liquidity:");
  console.log("  PRDX:", ethers.formatEther(prdxBal));
  console.log("  MATIC:", ethers.formatEther(maticForLP));

  // Approve if needed
  const allowance = await token.allowance(deployer.address, ROUTER);
  if (allowance < prdxBal) {
    console.log("\nApproving PRDX...");
    const approveTx = await token.approve(ROUTER, ethers.MaxUint256);
    await approveTx.wait();
    console.log("Approved ✓");
  } else {
    console.log("Already approved ✓");
  }

  const router = new ethers.Contract(ROUTER, ROUTER_ABI, deployer);
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  console.log("\nCalling addLiquidityETH (atomic)...");
  const tx = await router.addLiquidityETH(
    TOKEN,
    prdxBal,
    0n,       // min token (0 = no slippage limit for initial LP)
    0n,       // min ETH
    deployer.address,
    deadline,
    { value: maticForLP, gasLimit: GAS_LIMIT }
  );
  console.log("TX:", tx.hash);
  console.log("Waiting...");
  const receipt = await tx.wait();
  console.log("Confirmed block", receipt.blockNumber, "status:", receipt.status);

  const pair = new ethers.Contract(PAIR, PAIR_ABI, ethers.provider);
  const [r0, r1] = await pair.getReserves();
  const lpBal = await pair.balanceOf(deployer.address);
  const supply = await pair.totalSupply();

  console.log("\n=== ✅ LP SEEDED ===");
  console.log("Pair:        ", PAIR);
  console.log("Reserve0:    ", ethers.formatEther(r0), "(WMATIC)");
  console.log("Reserve1:    ", ethers.formatEther(r1), "(PRDX)");
  console.log("LP tokens:   ", ethers.formatEther(lpBal));
  console.log("LP supply:   ", ethers.formatEther(supply));
  console.log("QuickSwap:    https://quickswap.exchange/#/swap?outputCurrency=" + TOKEN);
  console.log("LP Pair:      https://polygonscan.com/address/" + PAIR);
  console.log("Lock LP:      https://app.unicrypt.network/amm/quickswap-v2/lock");
}

main().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
