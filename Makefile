# Makefile for ritual-agent-registry
# Common development tasks

.PHONY: help install test deploy clean audit

help:  ## Show this help
	@echo "Ritual Agent Registry — Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:  ## Install Python + Node dependencies
	@echo "Installing Python deps..."
	pip install -e cli/
	cd contracts && npm install
	@echo "✓ Dependencies installed"

build-contracts:  ## Compile AssemblyScript contract to WASM
	@echo "Building contracts..."
	cd contracts && npm run build
	@echo "✓ Contracts compiled to build/AgentRegistry.wasm"

generate-abi: build-contracts  ## Extract ABI from compiled contract
	@echo "Extracting ABI..."
	cd contracts && npm run abi
	@mkdir -p ../cli/abi
	@cp contracts/artifacts/abi.json ../cli/abi/AgentRegistry.json
	@echo "✓ ABI saved to cli/abi/AgentRegistry.json"

deploy-devnet:  ## Deploy to Ritual devnet
	@echo "Deploying to Ritual DEVNET..."
	@if [ -z "$$RITUAL_PRIVATE_KEY" ]; then echo "Error: Set RITUAL_PRIVATE_KEY"; exit 1; fi
	cd contracts && npx hardhat run scripts/deploy.js --network devnet
	@echo "✓ Deployed. Update .env with the returned address."

deploy-mainnet:  ## Deploy to Ritual mainnet (USE WITH CARE)
	@echo "Deploying to Ritual MAINNET..."
	@echo "⚠️  This will spend real RITUAL tokens. Are you sure?"
	@read -p "Type 'YES' to confirm: " confirm; if [ "$$confirm" != "YES" ]; then echo "Aborted."; exit 1; fi
	cd contracts && npx hardhat run scripts/deploy.js --network mainnet
	@echo "✓ Mainnet deployment complete."

test:  ## Run contract unit tests (Hardhat)
	@echo "Running contract tests..."
	cd contracts && npx hardhat test
	@echo "✓ All tests passed"

test-cli:  ## Run CLI integration tests
	@echo "Running CLI tests..."
	pytest tests/cli.test.py -v
	@echo "✓ CLI tests passed"

lint:  ## Lint Python and AssemblyScript
	flake8 cli/
	cd contracts && npm run lint

format:  ## Auto-format code
	black cli/
	cd contracts && npm run format

audit:  ## Run security scanner on contracts
	@echo "Scanning contracts with slither..."
	cd contracts && npx slither . --exclude info
	@echo "✓ Audit complete (check report for critical issues)"

register-example:  ## Register a sample agent (requires deployed contract)
	@echo "Registering example agent..."
	./cli/ritual-agents register \
		--name "Example Renderer" \
		--endpoint "https://example.com/agent" \
		--code-path examples/sample-agent.py \
		--capabilities "video-gen" "testing" \
		--metadata "ipfs://QmExample"
	@echo "✓ Example agent registered"

list-agents:  ## List all registered agents
	./cli/ritual-agents list

seed-agents:  ## Register several sample agents for testing
	@echo "Seeding test agents..."
	./scripts/seed-agents.js
	@echo "✓ Seeded 10 test agents"

logs:  ## Tail the audit/notify logs
	@echo "Tailing logs..."
	tail -f ~/.ritual-agent-registry/logs/*.log

clean:  ## Remove build artifacts
	rm -rf contracts/artifacts contracts/cache
	rm -rf cli/__pycache__ cli/*.pyc
	rm -rf .pytest_cache
	@echo "✓ Cleaned"

# ── Hermes Integration ───────────────────────────────────────────────────────────

hermes-load:  ## Load all relevant Ritual skills into Hermes
	@echo "Loading Ritual skills into Hermes..."
	@hermes skills install skills-sh/ritual-foundation/ritual-dapp-skills/ritual-dapp-agents --yes
	@hermes skills install skills-sh/ritual-foundation/ritual-dapp-skills/ritual-dapp-contracts --yes
	@hermes skills install skills-sh/ritual-foundation/ritual-dapp-skills/ritual-dapp-http --yes
	@hermes skills install skills-sh/ritual-foundation/ritual-dapp-skills/ritual-dapp-llm --yes
	@hermes skills install skills-sh/ritual-foundation/ritual-dapp-skills/ritual-dapp-scheduler --yes
	@echo "✓ Ritual skills loaded"

hermes-audit:  ## Run Hermes auditor agent
	hermes --skills agents/auditor ritual agents audit --all

hermes-notify:  ## Run Hermes notifier agent (daemon)
	hermes --skills agents/notifier ritual agents notify --watch-drop

# ── CI / GitHub Actions ──────────────────────────────────────────────────────────

ci: lint test  ## Run full CI pipeline (lint + test)
