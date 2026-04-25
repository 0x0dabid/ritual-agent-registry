
const hre = require("hardhat");
async function main() {
  const config = hre.config;
  console.log("Solidity sources path:", config.paths.sources);
  console.log("Artifacts path:", config.paths.artifacts);
  const fs = require("fs");
  const sourcesPath = config.paths.sources;
  if (fs.existsSync(sourcesPath)) {
    console.log("Files in sources:", fs.readdirSync(sourcesPath));
  }
}
main().catch(console.error);
