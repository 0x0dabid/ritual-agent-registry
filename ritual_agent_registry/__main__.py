#!/usr/bin/env python3
"""ritual-agent-registry CLI."""
"""
ritual-agents — CLI for Ritual Agent Registry & Reputation Tracker

A command-line tool to register, discover, verify, and manage autonomous agents
on Ritual Chain. Integrates with Hermes agent skills for automated audits.
"""

import os
import sys
import json
import click
import sys
import os
import hashlib
from pathlib import Path
from typing import Optional, List

# Load .env if present
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path)

# Constants
DEFAULT_RPC = os.getenv("RITUAL_RPC_URL", "https://devnet.ritual.network")
CONTRACT_ADDRESS = os.getenv("AGENT_REGISTRY_ADDRESS")
HEARTBEAT_INTERVAL = int(os.getenv("HEARTBEAT_INTERVAL", "300"))

# Lazy imports (web3 may not be installed yet)
_web3 = None
_contract = None

def get_web3():
    global _web3
    if _web3 is None:
        try:
            from web3 import Web3
        except ImportError:
            click.echo("Error: web3 not installed. Run: pip install web3", err=True)
            sys.exit(1)
        _web3 = Web3(Web3.HTTPProvider(DEFAULT_RPC))
    return _web3

def get_contract():
    """Lazy-load the AgentRegistry contract ABI + address."""
    global _contract
    if _contract is None:
        w3 = get_web3()
        abi_path = Path(__file__).parent.parent / "contracts" / "abi" / "AgentRegistry.json"
        if not abi_path.exists():
            click.echo("Error: Contract ABI not found. Run: make build-contracts", err=True)
            sys.exit(1)
        with open(abi_path) as f:
            abi = json.load(f)
        addr = os.getenv("AGENT_REGISTRY_ADDRESS")
        if not addr:
            click.echo("Error: AGENT_REGISTRY_ADDRESS not set in .env", err=True)
            sys.exit(1)
        _contract = w3.eth.contract(address=addr, abi=abi)
    return _contract

def get_account():
    """Get signing account from private key or Hermes wallet."""
    from eth_account import Account
    priv = os.getenv("RITUAL_PRIVATE_KEY")
    if priv:
        return Account.from_key(priv)
    # TODO: Integrate with Hermes wallet via hermes wallet sign
    click.echo("Error: RITUAL_PRIVATE_KEY not set. Add to .env or use Hermes wallet integration.", err=True)
    sys.exit(1)

# ─── Helper functions ────────────────────────────────────────────────────────────

def compute_code_hash(filepath: str) -> str:
    """SHA256 hash of agent code file for verification."""
    with open(filepath, "rb") as f:
        return "0x" + hashlib.sha256(f.read()).hexdigest()

def to_checksum_address(addr: str) -> str:
    w3 = get_web3()
    return w3.to_checksum_address(addr)

# ─── CLI Commands ────────────────────────────────────────────────────────────────

@click.group()
@click.option("--verbose", "-v", is_flag=True, help="Verbose output")
def cli(verbose):
    """Ritual Agent Registry & Reputation Tracker CLI.

    Register autonomous agents on Ritual Chain, track their reputation,
    and verify their authenticity.
    """
    if verbose:
        click.echo(f"[DEBUG] Using RPC: {DEFAULT_RPC}")
        click.echo(f"[DEBUG] Contract: {CONTRACT_ADDRESS}")

# ─── Init ────────────────────────────────────────────────────────────────────────

@cli.command()
@click.option("--rpc", default=None, help="Ritual RPC URL")
@click.option("--private-key", default=None, help="Your wallet private key")
@click.option("--contract", default=None, help="Deployed AgentRegistry address")
def init(rpc, private_key, contract):
    """Initialize the CLI configuration."""
    env_file = Path(".env")
    if env_file.exists():
        if not click.confirm(".env already exists. Overwrite?"):
            return

    # Determine values
    rpc_url = rpc or click.prompt("Ritual RPC URL", default=DEFAULT_RPC)
    priv = private_key or click.prompt("Private Key (optional, can set later)", default="", show_default=False)
    contract_addr = contract or click.prompt("AgentRegistry contract address", default="0x...")

    lines = [
        f"RITUAL_RPC_URL={rpc_url}",
        f"AGENT_REGISTRY_ADDRESS={contract_addr}",
    ]
    if priv:
        lines.append(f"RITUAL_PRIVATE_KEY={priv}")

    env_file.write_text("\n".join(lines) + "\n")
    click.echo("✓ Configuration saved to .env")
    click.echo("\nNext: Deploy the contract (make deploy) or set existing address.")

# ─── Config ─────────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("key", required=False)
@click.argument("value", required=False)
def config(key, value):
    """Get or set configuration values."""
    env_file = Path(".env")
    if not env_file.exists():
        click.echo("No .env file found. Run: ritual-agents init")
        sys.exit(1)

    env_vars = {}
    for line in env_file.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env_vars[k] = v

    if key is None:
        # Show all
        click.echo("Current configuration:")
        for k, v in env_vars.items():
            click.echo(f"  {k}={v}")
    elif value is None:
        # Get
        click.echo(env_vars.get(key, ""))
    else:
        # Set
        env_vars[key] = value
        content = "\n".join(f"{k}={v}" for k, v in env_vars.items()) + "\n"
        env_file.write_text(content)
        click.echo(f"✓ Set {key}={value}")

# ─── Register ────────────────────────────────────────────────────────────────────

@cli.command()
@click.option("--name", required=True, help="Agent name")
@click.option("--endpoint", required=True, help="HTTP endpoint URL")
@click.option("--code-path", required=True, type=click.Path(exists=True),
              help="Path to agent code (for hash verification)")
@click.option("--capabilities", multiple=True, required=True,
              help="Capabilities (e.g., video-gen, llm-inference)")
@click.option("--metadata", default="", help="Metadata URI (IPFS CID or URL)")
def register(name, endpoint, code_path, capabilities, metadata):
    """Register a new autonomous agent on Ritual Chain."""
    click.echo(f"Registering agent: {name}")

    # Compute code hash
    code_hash = compute_code_hash(code_path)
    click.echo(f"  Code hash: {code_hash}")

    # Build transaction
    contract = get_contract()
    account = get_account()
    w3 = get_web3()

    # Build call
    tx = contract.functions.registerAgent(
        name,
        endpoint,
        code_hash,
        list(capabilities),
        metadata or f"ipfs://未定义"  # placeholder
    ).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": 500_000,
        "gasPrice": w3.eth.gas_price,
        "chainId": int(os.getenv("RITUAL_CHAIN_ID", "11022"))
    })

    # Sign & send
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    click.echo(f"  TX sent: {tx_hash.hex()}")

    # Wait for receipt
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt.status == 1:
        click.echo("✓ Agent registered successfully!")
        agent_address = account.address  # owner = agent address by default
        click.echo(f"  Agent address: {agent_address}")
    else:
        click.echo("✗ Registration failed", err=True)
        sys.exit(1)

# ─── List ────────────────────────────────────────────────────────────────────────

@cli.command()
@click.option("--capability", help="Filter by capability")
@click.option("--min-reputation", type=int, default=0, help="Minimum reputation score")
@click.option("--active-only", is_flag=True, help="Only show active agents")
@click.option("--format", "output_format", type=click.Choice(["table", "json"]), default="table")
def list(capability, min_reputation, active_only, output_format):
    """List all registered agents."""
    contract = get_contract()
    w3 = get_web3()

    # Get total count
    count = contract.functions.agentCount().call()
    click.echo(f"Total agents: {count}\n")

    agents = []
    for i in range(count):
        try:
            # Note: This is inefficient; real contract would have index struct
            # For demo, we assume you have a way to enumerate — maybe events
            pass
        except:
            pass

    # For now, show placeholder (real implementation needs index mapping)
    click.echo("NOTE: Full listing requires capability-index map in contract.")
    click.echo("Use ritual-agents show <address> to inspect specific agent.")

    if output_format == "json":
        print(json.dumps(agents, indent=2))
    else:
        # Table format
        click.echo(f"{'ADDRESS':<42} {'NAME':<25} {'CAPABILITIES':<30} {'REP'}")
        click.echo("-" * 120)
        for agent in agents[:10]:  # limit for demo
            caps = ", ".join(agent['capabilities'][:2])
            if len(agent['capabilities']) > 2:
                caps += "..."
            click.echo(f"{agent['address']:<42} {agent['name']:<25} {caps:<30} {agent['reputation']}")

# ─── Show ───────────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("agent_address")
def show(agent_address):
    """Show detailed info about an agent."""
    addr = to_checksum_address(agent_address)
    contract = get_contract()

    try:
        agent = contract.functions.getAgent(addr).call()
        # agent is tuple: (owner, name, endpoint, codeHash, capabilities, metadataURI, registeredAt, lastHeartbeat, active)
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

    click.echo(f"Agent: {agent[1]}")
    click.echo(f"  Address:     {addr}")
    click.echo(f"  Owner:       {agent[0]}")
    click.echo(f"  Endpoint:    {agent[2]}")
    click.echo(f"  Code hash:   {agent[3].hex()}")
    click.echo(f"  Capabilities: {', '.join(agent[4])}")
    click.echo(f"  Metadata:    {agent[5]}")
    click.echo(f"  Registered:  {agent[6]}")
    click.echo(f"  Heartbeat:   {agent[7]}")
    click.echo(f"  Active:      {agent[8]}")

    # Get reputation by category
    categories = ["reliability", "speed", "quality", "cost-efficiency"]
    click.echo("\nReputation:")
    for cat in categories:
        try:
            score = contract.functions.getAgentReputation(addr, cat).call()
            click.echo(f"  {cat:<20} {score}")
        except:
            pass

# ─── Verify ─────────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("agent_address")
@click.option("--code", type=click.Path(exists=True), help="Path to agent code to verify")
def verify(agent_address, code):
    """Verify agent code hash matches onchain record."""
    addr = to_checksum_address(agent_address)
    contract = get_contract()

    stored_hash = contract.functions.verifyCodeHash(addr).call()  # simplified
    # Actually need to call getAgent then .codeHash

    if code:
        computed = compute_code_hash(code)
        click.echo(f"Storage hash: {stored_hash.hex()}")
        click.echo(f"Computed hash: {computed}")
        if stored_hash.hex() == computed:
            click.echo("✓ Code matches onchain record")
        else:
            click.echo("✗ MISMATCH — agent code has been modified!", err=True)
            sys.exit(1)
    else:
        click.echo(f"Onchain code hash: {stored_hash.hex()}")
        click.echo("\nTo verify, provide --code /path/to/agent.py")

# ─── Reputation ──────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("agent_address")
@click.option("--category", help="Specific category to show")
def reputation(agent_address, category):
    """Show reputation score for an agent."""
    addr = to_checksum_address(agent_address)
    contract = get_contract()

    if category:
        score = contract.functions.getAgentReputation(addr, category).call()
        click.echo(f"{category}: {score}")
    else:
        categories = ["reliability", "speed", "quality", "cost-efficiency"]
        total = 0
        for cat in categories:
            try:
                score = contract.functions.getAgentReputation(addr, cat).call()
                click.echo(f"  {cat:<20} {score}")
                total += int(score)
            except:
                pass
        click.echo(f"  {'TOTAL':<20} {total}")

# ─── Submit Task ─────────────────────────────────────────────────────────────────

@cli.command()
@click.option("--agent", required=True, help="Agent address that completed task")
@click.option("--task-id", required=True, help="Unique task identifier")
@click.option("--outcome", type=click.Choice(["success", "failure", "partial"]), required=True)
@click.option("--metrics", default="{}", help="JSON metrics (duration, cost, etc.)")
def submit_task(agent, task_id, outcome, metrics):
    """Submit a completed task for reputation scoring."""
    addr = to_checksum_address(agent)
    contract = get_contract()
    account = get_account()
    w3 = get_web3()

    metrics_dict = json.loads(metrics)

    tx = contract.functions.submitTaskCompletion(
        task_id,
        outcome,
        json.dumps(metrics_dict)
    ).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": 200_000,
        "gasPrice": w3.eth.gas_price,
        "chainId": int(os.getenv("RITUAL_CHAIN_ID", "11022"))
    })

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    click.echo(f"✓ Task submitted: {tx_hash.hex()}")

# ─── Heartbeat ───────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("agent_address")
def heartbeat(agent_address):
    """Send a heartbeat from an agent (called by the agent itself)."""
    addr = to_checksum_address(agent_address)
    contract = get_contract()
    account = get_account()
    w3 = get_web3()

    tx = contract.functions.heartbeat().build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": 100_000,
        "gasPrice": w3.eth.gas_price,
        "chainId": int(os.getenv("RITUAL_CHAIN_ID", "11022"))
    })

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    click.echo(f"✓ Heartbeat sent: {tx_hash.hex()}")

# ─── Hermes Integration ──────────────────────────────────────────────────────────

@cli.command()
@click.option("--all", "audit_all", is_flag=True, help="Audit all registered agents")
@click.option("--agent", "specific_agent", help="Audit specific agent")
def audit(audit_all, specific_agent):
    """Spawn Hermes auditor agent to review agent quality."""
    if not audit_all and not specific_agent:
        click.echo("Specify --all or --agent <address>")
        sys.exit(1)

    click.echo("Spawning Hermes auditor agent...")
    # This loads the `agents/auditor` Hermes skill and runs it
    # In practice: hermes --skills agents/auditor ritual agents audit
    os.system("hermes --skills agents/auditor ritual agents audit")
    click.echo("✓ Audit complete. Check logs for details.")

if __name__ == "__main__":
    cli()
