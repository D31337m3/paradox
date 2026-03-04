#!/usr/bin/env node
/**
 * PARADOX Auto-Deploy Watcher
 * Polls the deployer wallet every 30s.
 * Once >= MIN_MATIC is detected, runs the Hardhat deploy script automatically.
 *
 * Usage:  node scripts/watch-and-deploy.js
 */

require("dotenv").config();
const { ethers }   = require("ethers");
const { execSync } = require("child_process");

const DEPLOYER    = "0x565FE810c622882C623d4bB6e8A90EAf1db23f47";
const MIN_MATIC   = ethers.parseEther("0.5");
const POLL_MS     = 30_000;
const RPC         = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  console.log("\n🔮 PARADOX Auto-Deploy Watcher");
  console.log("Watching:", DEPLOYER);
  console.log("Required: 0.5 MATIC minimum");
  console.log("RPC:      ", RPC);
  console.log("─".repeat(50));
  console.log("Send MATIC to the address above, then this script will deploy automatically.\n");

  while (true) {
    try {
      const balance = await provider.getBalance(DEPLOYER);
      const matic   = ethers.formatEther(balance);
      process.stdout.write(`\r💰 Balance: ${parseFloat(matic).toFixed(4)} MATIC  `);

      if (balance >= MIN_MATIC) {
        console.log("\n\n✅ Funded! Starting deployment...\n");
        execSync("npx hardhat run scripts/deploy.js --network polygon", {
          stdio: "inherit",
          cwd: __dirname + "/..",
        });
        console.log("\n🎉 Deployment complete. Update frontend/src/contracts/addresses.js if needed.");
        process.exit(0);
      }
    } catch (e) {
      console.error("\nRPC error:", e.message, "— retrying...");
    }
    await new Promise(r => setTimeout(r, POLL_MS));
  }
}

main();
