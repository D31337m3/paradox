const hre = require("hardhat");
async function main() {
  const contracts = [
    { name: "BurnReputationNFT", address: "0xE6de4639FBaa59C7f24c11f8f078515e449C035F", args: [] },
    { name: "ParadoxToken",      address: "0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09",
      args: ["0x53201fFB7E6FA79CE2D48C082260cA42fE04Be13","0x53201fFB7E6FA79CE2D48C082260cA42fE04Be13",
             "0x53201fFB7E6FA79CE2D48C082260cA42fE04Be13","0x53201fFB7E6FA79CE2D48C082260cA42fE04Be13",
             "0x53201fFB7E6FA79CE2D48C082260cA42fE04Be13"] },
    { name: "TokenVesting",      address: "0x75812E84490a06C5D81B31862c8AF0c5F6b436B7",
      args: ["0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09","0x53201fFB7E6FA79CE2D48C082260cA42fE04Be13"] },
    { name: "EpochController",   address: "0x1fb3c47c85f65daaF4a48B27E3D9F9dd8607a88e",
      args: ["0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09","0xE6de4639FBaa59C7f24c11f8f078515e449C035F",
             "2000000000000000000000000","500000000000000000000000","10000000000000000000000000"] },
  ];
  for (const c of contracts) {
    try {
      await hre.run("verify:sourcify", { address: c.address, constructorArguments: c.args });
      console.log(`✅ ${c.name}`);
    } catch(e) {
      console.log(`⚠️  ${c.name}: ${e.message.split("\n")[0]}`);
    }
  }
}
main();
