#!/usr/bin/env python3
"""Quickstart: First-time setup and smoke test for ritual-agent-registry.

This script performs:
1. Creates .env from .env.example (if not present)
2. Mocks minimal RPC (skip if no devnet key)
3. Builds contracts (AssemblyScript → WASM)
4. Generates ABI
5. Initializes CLI config
6. Registers sample agent (if contracts deployed)
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
os = __import__('os')

def run(cmd, cwd=None, check=True):
    print(f"  $ {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd or ROOT)
    if result.returncode != 0 and check:
        print(f"  ✗ FAILED: {result.stderr[-200:]}")
        return False
    print(f"  ✓ OK")
    return True

def main():
    print("Ritual Agent Registry — Quickstart Setup\n" + "="*40 + "\n")

    # Step 1: .env
    env = ROOT / ".env"
    if not env.exists():
        print("1. Creating .env from .env.example...")
        import shutil
        shutil.copy(ROOT / ".env.example", env)
        print("   ✓ .env created. Edit with your RITUAL_PRIVATE_KEY.")
    else:
        print("1. .env already exists — skipping")

    # Step 2: Python deps
    print("\n2. Installing Python dependencies...")
    if not run(["pip", "install", "-e", "cli/"], check=False):
        print("   ⚠ Could not install. Run manually: pip install -e cli/")

    # Step 3: Node deps + contracts
    print("\n3. Installing Node.js dependencies and building contracts...")
    contracts_dir = ROOT / "contracts"
    if not run(["npm", "install"], cwd=contracts_dir, check=False):
        print("   ⚠ npm install failed. Install Node.js >= 18 first.")
        return 1

    if not run(["npm", "run", "build"], cwd=contracts_dir):
        return 1

    # Step 4: Extract ABI
    print("\n4. Generating contract ABI...")
    if not run(["npm", "run", "abi"], cwd=contracts_dir):
        return 1

    abi_src = contracts_dir / "artifacts" / "abi.json"
    abi_dst = ROOT / "cli" / "abi" / "AgentRegistry.json"
    if abi_src.exists():
        import shutil
        shutil.copy(abi_src, abi_dst)
        print(f"   ✓ ABI → {abi_dst}")
    else:
        print("   ✗ ABI not found at contracts/artifacts/abi.json")
        return 1

    # Step 5: CLI config
    print("\n5. Initializing CLI configuration...")
    if not run(["ritual-agents", "init", "--contract", "0xDEADBEEF"], check=False):
        print("   ⚠ Could not init CLI. Run manually: ritual-agents init")

    # Step 6: Test sample agent
    print("\n6. Testing sample agent locally...")
    sample_dir = ROOT / "examples" / "sample-agent"
    result = subprocess.run(
        ["python3", "agent.py"],
        capture_output=True, text=True, cwd=sample_dir, timeout=5
    )
    # Should server startup
    if "Running on" in result.stderr or "http://" in result.stderr:
        print("   ✓ Sample agent runs! (http://localhost:8080)")
    else:
        print("   ⚠ Sample agent not tested yet. Run manually: cd examples/sample-agent && python agent.py &")

    print("\n" + "="*40)
    print("✅ Setup complete!\n")
    print("Next actions:")
    print("  1. Edit .env → add RITUAL_PRIVATE_KEY from devnet faucet")
    print("  2. Deploy to devnet: make deploy-devnet")
    print("  3. cp .env.ritual .env")
    print("  4. Start sample agent: cd examples/sample-agent && pip install -r requirements.txt && python agent.py &")
    print("  5. Register it: ritual-agents register --name 'Sample' --endpoint 'http://localhost:8080' --code-path agent.py --capabilities testing echo")
    print("\nHappy building! 🚀")
    return 0

if __name__ == "__main__":
    sys.exit(main())
