# Ritual Agent Registry — Complete

Full-stack system: smart contracts + CLI + web frontend.

## Project Status

| Component | Status |
|-----------|--------|
| Smart contract (AgentRegistry.as) | ✅ Scaffolded |
| CLI tool (ritual-agents) | ✅ 10 commands |
| Hermes skills (auditor, notifier, updater) | ✅ 3 skills |
| Web frontend (Next.js) | ✅ Listing + detail pages |
| Deploy scripts | ✅ Hardhat + Makefile |
| Sample agent | ✅ Flask example |

Total: ~1,800 LOC across 30 files.

## Directory Layout

```
ritual-agent-registry/
├── contracts/          # AssemblyScript WASM precompile + Hardhat
├── cli/                # Python CLI (ritual-agents)
├── agents/             # Hermes skill wrappers
├── web/                # Next.js frontend (NEW)
├── examples/           # Sample agent
├── scripts/
├── Makefile
└── README.md
```

## Quick Start (CLI)

```bash
cd ~/ritual-agent-registry
make install && make build-contracts
cp .env.example .env && $EDITOR .env  # add RITUAL_PRIVATE_KEY
make deploy-devnet
cp .env.ritual .env
cd examples/sample-agent && pip install -r requirements.txt && python agent.py &
cd ../.. && ./cli/ritual-agents register --name "Sample" --endpoint "http://localhost:8080" --code-path agent.py --capabilities testing echo
```

## Quick Start (Web)

```bash
cd ~/ritual-agent-registry/web
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS
npm run dev
# Open http://localhost:3000
```

## What's Public

- **CLI** — Anyone can run `ritual-agents list` to see all agents
- **Block Explorer** — `https://explorer.ritual.network/address/<registry>` (once deployed)
- **Web Frontend** — Once deployed to Vercel, anyone can browse without wallet

## Deploy Web to Vercel

```bash
cd web
vercel --prod
# Set env vars in Vercel dashboard:
#   NEXT_PUBLIC_RITUAL_RPC_URL
#   NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS
```

After deploy: `https://ritual-agent-registry.vercel.app`

---

Built with 8 Ritual Foundation skills. 🚀
