import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
// Note: @ritual-contracts/hardhat-plugin is optional and not required for basic deployments.
// To use it, install from Ritual's private npm registry (if you have access).

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    devnet: {
      url: process.env.RITUAL_RPC_URL || "https://devnet.ritual.network",
      chainId: parseInt(process.env.RITUAL_CHAIN_ID || "11022"),
      accounts: process.env.RITUAL_PRIVATE_KEY ? [process.env.RITUAL_PRIVATE_KEY] : [],
    },
    mainnet: {
      url: "https://mainnet.ritual.network",
      chainId: 11023,
      accounts: process.env.RITUAL_PRIVATE_KEY ? [process.env.RITUAL_PRIVATE_KEY] : [],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
