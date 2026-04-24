#!/usr/bin/env node
/**
 * Seed Agents Script
 * Registers a set of sample agents on Ritual devnet for testing.
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Seeding Ritual Agent Registry with sample agents...\n");

  // Sample agents with varied capabilities
  const agents = [
    {
      name: "Ritual Video Renderer",
      endpoint: "https://memorings.vercel.app/api/agent/render",
      capabilities: ["video-generation", "manim", "telegram-notify"],
      codeHash: "0xdeadbeef00000000000000000000000000000000000000000000000000000000",  // fake
      metadataURI: "ipfs://QmVideoRenderer",
    },
    {
      name: "LLM Inference Bot",
      endpoint: "https://llm-ritual.example.com/v1/complete",
      capabilities: ["llm-inference", "text-gen", "embedding"],
      codeHash: "0xabc1230000000000000000000000000000000000000000000000000000000000",
      metadataURI: "ipfs://QmLLMBot",
    },
    {
      name: "Audio Transcription",
      endpoint: "https://ritual-whisper.dev/transcribe",
      capabilities: ["audio", "transcription", "llm-inference"],
      codeHash: "0x789def0000000000000000000000000000000000000000000000000000000000",
      metadataURI: "ipfs://QmAudio",
    },
    {
      name: "Image Generator",
      endpoint: "https://ritual-stable-diffusion.example.com/generate",
      capabilities: ["image-generation", "multimodal", "stable-diffusion"],
      codeHash: "0xfedcba0000000000000000000000000000000000000000000000000000000000",
      metadataURI: "ipfs://QmImageGen",
    },
    {
      name: "Market Data Fetcher",
      endpoint: "https://ritual-oracle.example.com/price",
      capabilities: ["oracle", "price-feed", "http"],
      codeHash: "0x1234560000000000000000000000000000000000000000000000000000000000",
      metadataURI: "ipfs://QmOracle",
    },
  ];

  const [deployer] = await hre.ethers.getSigners();
  const registryAddress = process.env.AGENT_REGISTRY_ADDRESS;
  if (!registryAddress) {
    console.error("Error: AGENT_REGISTRY_ADDRESS not set in .env");
    process.exit(1);
  }

  const registry = await hre.ethers.getContractAt("AgentRegistry", registryAddress);

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    console.log(`[${i + 1}/${agents.length}] Registering: ${agent.name}`);

    try {
      const tx = await registry.registerAgent(
        agent.name,
        agent.endpoint,
        agent.codeHash,
        agent.capabilities,
        agent.metadataURI
      );
      await tx.wait();
      console.log(`  ✓ Registered at ${registryAddress}`);
    } catch (err) {
      console.error(`  ✗ Failed:`, err.message);
    }
  }

  console.log("\n✓ Seeding complete!");
  console.log("Run: ritual-agents list");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
