# Ritual Agent Registry — Web Frontend

Next.js + Tailwind dashboard for browsing and registering autonomous agents on Ritual Chain.

## Features

- **Agent Directory** — filter by capability, search by name
- **Agent Detail Pages** — view full info, reputation, code hash verification
- **Wallet Connect** — Ritual wallet integration
- **Registration Form** — submit new agents from browser
- **Real-time Stats** — total agents, active count, capability distribution

## Quickstart

```bash
cd ~/ritual-agent-registry/web
npm install
cp .env.local.example .env.local
# Edit .env.local with your deployed contract address
npm run dev
# → http://localhost:3000
```

## Deploy to Vercel

```bash
git add web && git commit -m "Add web frontend"
git push
# Import repo in vercel.com, set env vars, deploy
```

See full docs in web/README.md
