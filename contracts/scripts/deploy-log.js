// Deploy ParadoxLog — permanent on-chain chat archive for the PARADOX experiment
// Run: npx hardhat run scripts/deploy-log.js --network polygon

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("═══════════════════════════════════════════════");
  console.log("  PARADOX — Deploying ParadoxLog");
  console.log("═══════════════════════════════════════════════");
  console.log("  Deployer:", deployer.address);

  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("  Balance: ", ethers.formatEther(bal), "POL");

  const Factory = await ethers.getContractFactory("ParadoxLog");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("\n  ✅ ParadoxLog deployed:", address);
  console.log("  Polygonscan:", `https://polygonscan.com/address/${address}`);

  // Update frontend addresses.js
  const addrFile = path.join(__dirname, "../../frontend/src/contracts/addresses.js");
  if (fs.existsSync(addrFile)) {
    let src = fs.readFileSync(addrFile, "utf8");
    if (src.includes("ParadoxLog:")) {
      src = src.replace(/ParadoxLog:\s*"[^"]*"/, `ParadoxLog: "${address}"`);
    } else {
      src = src.replace(
        "export const CONTRACT_ADDRESSES = {",
        `export const CONTRACT_ADDRESSES = {\n  ParadoxLog:        "${address}",`
      );
    }
    fs.writeFileSync(addrFile, src);
    console.log("  ✅ addresses.js updated");
  }

  console.log("\n  To verify on Polygonscan:");
  console.log(`  npx hardhat verify --network polygon ${address}`);
}

main().catch(e => { console.error(e); process.exit(1); });
