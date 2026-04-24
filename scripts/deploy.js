// Ritual Agent Registry Deployment Script
// Uses Hardhat + ritual-contracts plugin

const hre = require("hardhat");

async function main() {
  const chainId = await hre.getChainId();
  console.log(`
🚀 Deploying Ritual Agent Registry to chain ${chainId}...\n`);

  // Get signer
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`Account balance: ${(await deployer.getBalance()).toString()} wei\n`);

  // Read compiled artifact
  const artifact = require("../contracts/artifacts/AgentRegistry.json");
  const factory = new hre.ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  // Estimate gas
  const gasEstimate = await factory.estimateGas.deploy();
  console.log(`Estimated gas: ${gasEstimate.toString()}`);

  // Deploy
  console.log("Deploying contract...");
  const contract = await factory.deploy({
    gasLimit: gasEstimate.mul(120).div(100), // 20% buffer
  });

  await contract.deployed();
  console.log(`\n✓ Contract deployed!`);
  console.log(`  Address: ${contract.address}`);
  console.log(`  Explorer: https://explorer.ritual.network/address/${contract.address}`);

  // Verify on Etherscan-like block explorer (if available)
  try {
    await hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: [],
    });
    console.log("✓ Contract verified on explorer");
  } catch (err) {
    console.log("⚠ Could not auto-verify. Verify manually at the explorer.");
  }

  // Save address to .env.ritual
  const fs = require("fs");
  const envPath = "../.env.ritual";
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }
  envContent = `AGENT_REGISTRY_ADDRESS=${contract.address}\nRITUAL_CHAIN_ID=${chainId}\n`;
  fs.writeFileSync(envPath, envContent);
  console.log(`✓ Saved ${envPath}`);
  console.log(`\nNext: cp .env.ritual .env && ritual-agents list`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
