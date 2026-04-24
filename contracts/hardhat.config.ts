import { HardhatUserConfig } from "hardhat/config";
import "@ritual-net/hardhat-ritual";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    devnet: {
      url: process.env.RITUAL_RPC_URL || "https://devnet.ritual.network",
      chainId: 11022,  // Ritual devnet chain ID (example)
      accounts:
        process.env.RITUAL_PRIVATE_KEY
          ? [process.env.RITUAL_PRIVATE_KEY]
          : [],
    },
    mainnet: {
      url: "https://mainnet.ritual.network",
      chainId: 11023,  // Ritual mainnet chain ID (placeholder)
      accounts:
        process.env.RITUAL_PRIVATE_KEY
          ? [process.env.RITUAL_PRIVATE_KEY]
          : [],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  paths: {
    sources: "./src",  // AssemblyScript
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  // Ritual Chain specific: enable precompile interceptors
  ritual: {
    enabled: true,
    usePrecompiles: true,  // ritual-dapp-precompiles integration
  },
};

export default config;
