# Ritual Agent Registry & Reputation Tracker

A decentralized registry for autonomous AI agents on Ritual Chain. Register agents, track their on-chain activity, and build reputation scores — all stored onchain with data availability backed by Ritual's infrastructure.

## Overview

This project implements a **DID-like registry** where autonomous agents (including Hermes agents, bots, and smart contracts with agent-like behavior) can:

- 📝 **Register** their endpoint, capabilities, and metadata
- 📊 **Log** completed tasks and interactions on-chain
- ⭐ **Earn** reputation based on successful execution and community ratings
- 🔍 **Verify** agent authenticity via code hash attestations

Built using Ritual Chain's precompiles for agent lifecycle management and data availability for large agent payloads.

---

## Skills Used

| Skill | Purpose |
|-------|---------|
| `ritual-dapp-agents` | Sovereign & persistent agent patterns, agent lifecycle hooks |
| `ritual-dapp-contracts` | Smart contract development (precompile integration) |
| `ritual-dapp-wallet` | Wallet connection, transaction signing, address management |
| `ritual-dapp-http` | External endpoint resolution, agent health checks |
| `ritual-dapp-llm` | LLM-based task evaluation, reputation scoring, outcome analysis |
| `ritual-dapp-da` | Data availability — store large agent code/trace blobs |
| `ritual-dapp-scheduler` | Timed reputation updates, periodic agent audits |
| `ritual-dapp-secrets` | Secure storage of agent API keys and webhook secrets |
| `ritual-dapp-design` | Architectural patterns for scalable agent systems |

---

## Project Structure

```
ritual-agent-registry/
├── contracts/
│   ├── AgentRegistry.as      # Main registry contract (AssemblyScript/Ritual)
│   ├── ReputationTracker.as  # Reputation scoring logic
│   ├── AgentRegistry.t.sol   # Solidity interface & tests
│   └── abi/                  # Generated ABI files
├── cli/
│   ├── ritual-agents         # Main CLI entrypoint
│   ├── commands/
│   │   ├── register.py       # Register new agent
│   │   ├── list.py           # List all agents with filters
│   │   ├── show.py           # Show agent details
│   │   ├── update.py         # Update agent metadata
│   │   ├── reputation.py     # View/update reputation scores
│   │   ├── verify.py         # Verify agent authenticity (code hash)
│   │   └── submit-task.py    # Submit completed task for reputation
│   ├── config.py             # Config management (RPC, chain ID)
│   └── utils.py              # Helpers (address formatting, tx sending)
├── agents/
│   ├── auditor/
│   │   ├── SKILL.md          # Hermes skill for automated agent auditing
│   │   └── prompts.py        # LLM prompts for quality scoring
│   ├── notifier/
│   │   └── SKILL.md          # Telegram/webhook notifier agent
│   └── reputation-updater/
│       └── SKILL.md          # Periodic reputation refresh agent
├── scripts/
│   ├── deploy.js             # Hardhat/Foundry deployment script
│   ├── verify-agent.js       # Off-chain agent verification utility
│   └── seed-agents.js        # Register sample agents on mainnet
├── examples/
│   ├── sample-agent-registration.json
│   ├── reputation-score-calculation.md
│   └── multi-chain-agent.json
├── tests/
│   ├── registry.test.ts      # Unit tests for contract logic
│   ├── cli.test.py           # CLI integration tests
│   └── e2e/
│       └── full-registration-flow.py
├── .env.example              # Environment variables template
├── .github/workflows/ci.yml  # CI for contract + CLI
├── package.json              # Node deps (hardhat/foundry bindings)
├── pyproject.toml            # Python deps (CLI tooling)
├── Makefile                  # Common tasks: make deploy, make test
└── README.md                 # This file
```

---

## Quick Start

### Prerequisites
```bash
# Node.js (for contract tooling)
node >= 18

# Python (for CLI)
python >= 3.11

# Hermes CLI
curl -fsSL https://raw.githubusercontent.com/ritual-net/hermes/main/install.sh | sh

# Ritual Chain RPC endpoint (devnet)
export RITUAL_RPC_URL="https://devnet.ritual.network"
```

### Install & Register First Agent

```bash
# 1. Clone & install CLI
git clone https://github.com/your-username/ritual-agent-registry
cd ritual-agent-registry
pip install -e cli/

# 2. Compile contracts (AssemblyScript → WASM precompile)
npm install
npm run build:contracts

# 3. Deploy to Ritual devnet (uses ritual-dapp-deploy skill)
hermes skills load ritual-dapp-deploy
./scripts/deploy.js --network devnet

# 4. Configure CLI
ritual-agents config set --rpc $RITUAL_RPC_URL
ritual-agents config set --private-key $DEVNET_PRIVATE_KEY  # or use hermes wallet

# 5. Register your first agent
ritual-agents register \
  --name "Memorings Video Renderer" \
  --endpoint "https://memorings.vercel.app/api/agent/handle" \
  --capabilities "video-generation,manim-rendering,telegram-notify" \
  --description "Renders Manim videos for event photobooths" \
  --owner 0xYourWalletAddress

# 6. List all agents
ritual-agents list --sort reputation
```

---

## CLI Commands

```bash
# Agent Registration
ritual-agents register \
  --name "MyAgent" \
  --endpoint "https://api.example.com/agent" \
  --capabilities "video-gen,llm-inference" \
  --metadata-uri "ipfs://Qm..." \
  --code-hash "0xABCD..."            # SHA256 of agent code

# Agent Discovery
ritual-agents list [--capability video-gen] [--min-reputation 50]
ritual-agents show <agent-address>
ritual-agents verify <agent-address>    # Checks code hash matches onchain record

# Reputation
ritual-agents reputation <agent-address>
ritual-agents submit-task \
  --agent <address> \
  --task-id "job-123" \
  --outcome "success" \
  --metrics '{"duration": 12.5, "cost": 0.004}'

# Configuration
ritual-agents config set --rpc <url>
ritual-agents config set --chain-id 11022  # Ritual devnet
```

---

## Smart Contract Design

### AgentRegistry (Storage Layout)

```
struct Agent {
    address owner;              // Who registered this agent
    string name;                // Human-readable name
    string endpoint;            // HTTP endpoint URL
    bytes32 codeHash;           // SHA256 of agent code (for verification)
    string[] capabilities;      // e.g., ["llm", "video"]
    string metadataURI;         // IPFS CID for extended metadata
    uint256 registeredAt;       // Block timestamp
    uint256 lastHeartbeat;      // Last pong from agent
    bool active;                // Active/inactive flag
}

mapping(address => Agent) public agents;
mapping(address => uint256) public reputation[agentAddress][category];
mapping(bytes32 => bool) public codeHashVerified;  // Prevent duplicates

event AgentRegistered(address indexed agent, address indexed owner, string name);
event ReputationUpdated(address indexed agent, uint256 score, string category);
```

### Reputation Scoring

```solidity
// Categories: reliability, speed, quality, cost-efficiency
// Each task submitted by an agent updates its score via exponential moving average:
// newScore = α * outcome + (1-α) * oldScore
// where α = 1 / (count + 1)
```

---

## Hermes Skill Integration

The `agents/` directory contains Hermes skills that automate registry operations:

### `agents/auditor/SKILL.md`
- **Triggers on**: `ritual agents audit --all`
- **Does**: Spawns sovereign agent that:
  1. Fetches all registered agents
  2. Pings each endpoint (health check)
  3. Uses LLM (`ritual-dapp-llm`) to score agent descriptions (clarity, honesty)
  4. Submits `audit-score` to reputation tracker

### `agents/notifier/SKILL.md`
- **Triggers on**: `ritual agents notify --reputation-drop`
- **Does**: Watches reputation updates → sends Telegram alert when agent score drops >30%.

### `agents/reputation-updater/SKILL.md`
- **Triggers on**: `cron "0 0 * * *"` (daily)
- **Does**: Decays old reputation scores (time-weighted), refreshes active agents.

---

## Future Roadmap

| Milestone | Features |
|-----------|----------|
| **V1** (Current) | Registry, basic reputation, CLI tool |
| **V2** | DA layer integration for large agent code blobs, precompile caller patterns |
| **V3** | Agent discovery API + GraphQL endpoint, frontend dashboard |
| **V4** | Agent-to-agent payment escrow (using Ritual's native token) |
| **V5** | Cross-chain agent registry (Base, Optimism, Arbitrum — EIP-3770 compatible) |

---

## Why This Matters

The **Agent Economy** needs a phonebook and credit score system. Ritual Chain's precompiles and DA layer make it the perfect substrate. This project:

1. 📈 **Solves real need** — agents need discoverability & trust
2. 🛠️ **Teaches you Ritual** — you'll use 7+ Ritual skills
3. 🏗️ **Infrastructure play** — other builders will use it (network effects)
4. 📱 **CLI-first** — matches your terminal affinity
5. 🤖 **AI-native** — agents auditing agents is meta

---

## License

MIT — free for anyone to fork, extend, and deploy on Ritual mainnet.

---

**Next step**: Run `ritual-agents init` once deployed to bootstrap your local config.

</content>