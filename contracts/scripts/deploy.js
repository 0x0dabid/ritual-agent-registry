// Ritual Chain deployment script for AgentRegistry (Solidity version)
// Usage (from contracts/):
//   RITUAL_PRIVATE_KEY=0x... RITUAL_RPC_URL=... RITUAL_CHAIN_ID=11022 npx hardhat run scripts/deploy.js --network devnet

const hre = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying AgentRegistry to Ritual Chain...");
  console.log(`   RPC: ${hre.config.networks.devnet.url}`);
  console.log(`   Chain ID: ${hre.config.networks.devnet.chainId}\n`);

  // Deploy the contract
  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();

  await registry.waitForDeployment();
  const address = await registry.getAddress();

  console.log("✅ AgentRegistry deployed!\n");
  console.log(`   Contract: ${address}\n`);

  // Generate simple .env snippet for downstream tooling
  const fs = require("fs");
  const envLines = [
    `# Ritual Chain / Agent Registry deployment`,
    `AGENT_REGISTRY_ADDRESS=${address}`,
    `RITUAL_CHAIN_ID=${hre.config.networks.devnet.chainId}`,
    `RITUAL_RPC_URL=${hre.config.networks.devnet.url}`
  ];
  fs.writeFileSync(".env.ritual", envLines.join("\n"));
  console.log("   Saved .env.ritual (AGENT_REGISTRY_ADDRESS, RITUAL_CHAIN_ID, RITUAL_RPC_URL)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
