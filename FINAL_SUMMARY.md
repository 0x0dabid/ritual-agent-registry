# 🏗️ Ritual Agent Registry & Reputation Tracker

## Project Summary

You now have a **full-stack autonomous agent registry** built for Ritual Chain using 7+ Ritual skills:

```
ritual-agent-registry/
├── contracts/
│   ├── AgentRegistry.as        # Main registry (WASM precompile)
│   ├── hardhat.config.ts       # Ritual network config
│   ├── package.json
│   ├── tsconfig.json
│   └── scripts/
│       └── deploy.js           # Devnet/mainnet deploy
├── cli/
│   ├── __init__.py
│   ├── __main__.py             # Entry: ritual-agents
│   ├── config.py
│   ├── utils.py
│   └── abi/
│       └── AgentRegistry.json  # Generated ABI
├── agents/
│   ├── auditor/SKILL.md        # Hermes skill: daily agent quality audit
│   ├── notifier/SKILL.md       # Hermes skill: Telegram alerts
│   └── reputation-updater/SKILL.md  # Daily decay & refresh
├── examples/
│   └── sample-agent/           # Flask demo agent
├── scripts/
│   ├── deploy.js
│   ├── seed-agents.js          # Register sample agents
│   └── quickstart.py           # One-command setup
├── Makefile                    # Dev commands
├── pyproject.toml              # Python deps
├── .env.example
└── README.md                   # Full docs
```

---

## 🎯 What It Does

| Component | Function |
|-----------|----------|
| **AgentRegistry** (contract) | Onchain mapping: agent address → name, endpoint, codeHash, capabilities, heartbeat |
| **ReputationTracker** (contract) | Per-category scores (reliability, speed, quality, cost) with decay & bonuses |
| **ritual-agents CLI** | Terminal tool to register/list/verify agents |
| **Hermes Auditor** | Daily audit: health-check + LLM quality scoring |
| **Hermes Notifier** | Telegram alerts for reputation drops / deactivations |
| **Hermes Updater** | Daily reputation decay + heartbeat timeout handling |
| **Sample Agent** | Minimal Flask server showing integration |

---

## 🚀 Skills Used (8 total)

1. **`ritual-dapp-agents`** — sovereign agent patterns (for auditor/notifier/updater agents)
2. **`ritual-dapp-contracts`** — contract interaction (ABI encoding, tx sending)
3. **`ritual-dapp-wallet`** — wallet signing, address derivation
4. **`ritual-dapp-http`** — endpoint health checks + Telegram Bot API
5. **`ritual-dapp-llm`** — LLM-based agent quality scoring
6. **`ritual-dapp-scheduler`** — cron-triggered reputation updates
7. **`ritual-dapp-secrets`** — secure storage of Telegram bot token
8. **`ritual-dapp-design`** — architectural patterns (registry, discovery)

---

## 📦 Quick Start (5 steps)

```bash
# 1. Enter project & install deps
cd ~/ritual-agent-registry
make install

# 2. Build contracts (AssemblyScript → WASM)
make build-contracts

# 3. Deploy to Ritual devnet
# First, get devnet RPC URL + private key from https://ritual.network/devnet
cp .env.example .env
# EDIT .env with your values, then:
make deploy-devnet
# → outputs address, saves to .env.ritual

# 4. Update .env with deployed address
cp .env.ritual .env

# 5. Start sample agent in background
cd examples/sample-agent
pip install -r requirements.txt
python agent.py &
cd ../..

# 6. Register it
./cli/ritual-agents register \
  --name "Sample Renderer" \
  --endpoint "http://localhost:8080" \
  --code-path examples/sample-agent/agent.py \
  --capabilities testing echo video-rendering
```

---

## 🧪 Test Flow

```bash
# Verify registration
ritual-agents list
ritual-agents show 0xYourAgentAddress

# Submit fake task (boosts reputation)
ritual-agents submit-task \
  --agent 0xYourAgentAddress \
  --task-id test-001 \
  --outcome success \
  --metrics '{"duration": 0.5}'

# Check reputation
ritual-agents reputation 0xYourAgentAddress

# Run auditor (LLM scoring)
hermes --skills agents/auditor ritual agents audit --all

# Start notifier daemon (watches for drops)
hermes --skills agents/notifier ritual agents notify --watch-drop &
```

---

## 📡 Architecture Diagram (conceptual)

```
[ritual-agents CLI]    [Hermes Auditor]    [Hermes Notifier]
        │                     │                    │
        ▼                     ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ AgentRegistry   │  │ Reputation      │  │ Telegram Bot    │
│ (onchain)       │◄─┤ Tracker         │◄─┤ API             │
│                 │  │ (onchain)       │  │                 │
│  agent.address  │  │                 │  │                 │
│  agent.endpoint │  │ score.category  │  │ alert message   │
│  agent.capabilities        │                    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         ▲
         │
    [Sample Agent]
    (Flask server running on port 8080)
```

---

## 🔮 Future Extensions (you can build these)

| Idea | Skill | Effort |
|------|-------|--------|
| GraphQL API for agent search | `ritual-dapp-http` + Express | 2d |
| React dashboard for registry | `ritual-dapp-frontend` | 3d |
| Cross-chain agent bridge | `ritual-dapp-agents` + `ritual-dapp-wallet` | 1w |
| Agent code marketplace (sell/rent agents) | `ritual-dapp-contracts` + `ritual-dapp-llm` | 2w |
| DAO governance for registry upgrades | `ritual-dapp-da` + voting precompile | 3d |

---

## 🧠 Why This Project is Right for You

✅ **Pure Ritual focus** — no memorings overlap
✅ **Uses 7+ Ritual skills** — deep platform mastery
✅ **CLI-first** — terminal-native like you prefer
✅ **Hermes integration** — autonomous agents monitoring agents (meta!)
✅ **Real infrastructure** — other builders will actually use this
✅ **Extensible** — can spin off into marketplace, DAO, bridges
✅ **Teaches** smart contracts (AssemblyScript), agent patterns, reputation systems

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `contracts/AgentRegistry.as` | Core contract: register, heartbeat, reputation |
| `cli/ritual-agents` | Main CLI (register, list, show, verify, submit-task) |
| `agents/auditor/SKILL.md` | Hermes skill: daily LLM audit of all agents |
| `agents/notifier/SKILL.md` | Hermes skill: Telegram alerts for events |
| `examples/sample-agent/agent.py` | Minimal agent you can run locally |
| `scripts/deploy.js` | Hardhat + ritual-contracts deployment |
| `Makefile` | One-command dev tasks |

---

## 🐛 Known Gaps (future work)

- Agent enumeration in contract currently O(n). Later: add `getAgentsByCapability` index structs (already scaffolded in contract)
- ABI generation needs asb config tweaks (Ritual precompile bindings)
- Hermes skills currently documented; actual Python scripts for auditor/notifier not yet implemented (use hermes prompt + skill instead)
- Onchain code hash verification only stores bytes32 (needs offchain DA for full code); placeholder for `ritual-dapp-da`

---

## 📞 Get Help

```bash
# Show CLI help
ritual-agents --help

# Show contract docs
cat contracts/AgentRegistry.as | grep -E "(@external|func )"

# View Hermes skill
cat agents/auditor/SKILL.md

# Project docs
cat README.md
```

---

**Status**: ✅ Scaffold complete — ready for contract deployment & first agent registration.

Want to extend it with: (a) GraphQL API, (b) React dashboard, or (c) cross-chain bridge agent next?
