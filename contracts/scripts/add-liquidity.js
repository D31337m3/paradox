/**
 * PARADOX — Add QuickSwap V2 Liquidity
 *
 * Creates the PRDX/WMATIC pair on QuickSwap and seeds initial liquidity.
 * Run ONCE right after deployment.
 *
 * Usage:
 *   node scripts/add-liquidity.js [PRDX_AMOUNT] [MATIC_AMOUNT]
 *   e.g. node scripts/add-liquidity.js 500000000 1.5
 */
require("dotenv").config();
const { ethers } = require("ethers");

const RPC           = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
const TOKEN_ADDRESS = "0x7419Bb73fc3890fA11f71B69381633Be983B44a7";

// QuickSwap V2 on Polygon Mainnet
const QUICKSWAP_ROUTER  = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const QUICKSWAP_FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
const WMATIC            = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

const ROUTER_ABI = [
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function factory() view returns (address)",
];
const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) view returns (address pair)",
];
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

async function main() {
  const PRDX_ARG  = process.argv[2] ? parseFloat(process.argv[2]) : 500_000_000;
  const MATIC_ARG = process.argv[3] ? parseFloat(process.argv[3]) : 1.0;

  const PRDX_AMOUNT  = ethers.parseEther(PRDX_ARG.toString());
  const MATIC_AMOUNT = ethers.parseEther(MATIC_ARG.toString());

  // Slippage: accept 1% less than desired
  const PRDX_MIN  = PRDX_AMOUNT  * 99n / 100n;
  const MATIC_MIN = MATIC_AMOUNT * 99n / 100n;

  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet   = new ethers.Wallet("0x" + process.env.PRIVATE_KEY, provider);
  const balance  = await provider.getBalance(wallet.address);

  console.log("\n💧 PARADOX — Add QuickSwap Liquidity");
  console.log("Wallet:      ", wallet.address);
  console.log("MATIC balance:", ethers.formatEther(balance));
  console.log("PRDX to add: ", ethers.formatEther(PRDX_AMOUNT));
  console.log("MATIC to add:", ethers.formatEther(MATIC_AMOUNT));

  if (balance < MATIC_AMOUNT + ethers.parseEther("0.05")) {
    throw new Error(`Insufficient MATIC. Have ${ethers.formatEther(balance)}, need ${MATIC_ARG + 0.05} (+ gas)`);
  }

  const token   = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, wallet);
  const router  = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, wallet);
  const factory = new ethers.Contract(QUICKSWAP_FACTORY, FACTORY_ABI, provider);

  // Check PRDX balance
  const prdxBal = await token.balanceOf(wallet.address);
  console.log("PRDX balance:", ethers.formatEther(prdxBal));
  if (prdxBal < PRDX_AMOUNT) throw new Error(`Insufficient PRDX balance`);

  // Check if pair exists
  const existingPair = await factory.getPair(TOKEN_ADDRESS, WMATIC);
  if (existingPair !== ethers.ZeroAddress) {
    console.log("⚠️  Pair already exists at:", existingPair);
    console.log("   This will add to existing LP, not create a new pair.");
  } else {
    console.log("✓  Pair does not exist yet — will be created.");
  }

  // Step 1: Approve router to spend PRDX
  const allowance = await token.allowance(wallet.address, QUICKSWAP_ROUTER);
  if (allowance < PRDX_AMOUNT) {
    console.log("\n1️⃣  Approving PRDX...");
    const approveTx = await token.approve(QUICKSWAP_ROUTER, ethers.MaxUint256);
    await approveTx.wait();
    console.log("   Approved ✓", approveTx.hash);
  } else {
    console.log("\n1️⃣  PRDX already approved ✓");
  }

  // Step 2: Add liquidity
  console.log("\n2️⃣  Adding liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 min
  const lpTx = await router.addLiquidityETH(
    TOKEN_ADDRESS,
    PRDX_AMOUNT,
    PRDX_MIN,
    MATIC_MIN,
    wallet.address,     // LP tokens → deployer wallet (LOCK THESE!)
    deadline,
    { value: MATIC_AMOUNT }
  );
  console.log("   TX sent:", lpTx.hash);
  const receipt = await lpTx.wait();
  console.log("   Confirmed in block", receipt.blockNumber, "✓");

  // Get pair address
  const pairAddr = await factory.getPair(TOKEN_ADDRESS, WMATIC);
  console.log("\n✅  LP created!");
  console.log("   Pair address:", pairAddr);
  console.log("   QuickSwap:    https://quickswap.exchange/#/add/" + TOKEN_ADDRESS + "/" + WMATIC);
  console.log("   Pair on Polygonscan: https://polygonscan.com/address/" + pairAddr);
  console.log("\n⚠️  IMPORTANT: Lock LP tokens on Unicrypt to build trust:");
  console.log("   https://app.unicrypt.network/amm/quickswap-v2/lock");
  console.log("   LP token address:", pairAddr);
}

main().catch(e => { console.error("\n❌", e.message); process.exit(1); });
