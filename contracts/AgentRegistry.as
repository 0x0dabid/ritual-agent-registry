# Ritual Agent Registry Smart Contract
# AssemblyScript + Ritual Precompiles

# Import Ritual Chain precompiles
# Based on: https://docs.ritual.network/reference/precompiles

UsingPrecompiles = import("./UsingPrecompiles.sol").UsingPrecompiles

# Storage keys
AGENT_COUNT_KEY = bytes32("agent-registry.count")
AGENT_PREFIX = bytes32("agent.")          # agent.<address> -> Agent struct
CAPABILITY_INDEX_PREFIX = bytes32("capability.")  # capability.<capability> -> address[]
REPUTATION_PREFIX = bytes32("reputation.")        # reputation.<address>.<category> -> uint256
CODE_HASH_INDEX = bytes32("code-hash.")           # code-hash.<hash> -> bool (dedup)

# Reputation categories
RELIABILITY = "reliability"
SPEED = "speed"
QUALITY = "quality"
COST_EFFICIENCY = "cost-efficiency"

struct Agent {
    owner: address
    name: string
    endpoint: string            # HTTP URL
    codeHash: bytes32           # SHA256 of agent code for verification
    capabilities: string[]
    metadataURI: string         # IPFS CID or HTTP URL
    registeredAt: uint64
    lastHeartbeat: uint64
    active: bool
}

struct ReputationUpdate {
    agent: address
    category: string
    scoreDelta: uint256
    reason: string
    blockNumber: uint64
}

# Storage helpers
@external
func getAgent(agentAddress: address) -> Agent {
    let key = AGENT_PREFIX + agentAddress.toString()
    return storage.read(key)
}

@external
func agentExists(agentAddress: address) -> bool {
    let key = AGENT_PREFIX + agentAddress.toString()
    return storage.has(key)
}

# ─── Registration ────────────────────────────────────────────────────────────────

@external
func registerAgent(
    name: string,
    endpoint: string,
    codeHash: bytes32,
    capabilities: string[],
    metadataURI: string
) -> address {
    # 1. msg.sender becomes the owner
    let owner = msg.sender

    # 2. Check if agent address already registered (idempotent)
    if storage.has(AGENT_PREFIX + owner.toString()) {
        revert("Agent already registered")
    }

    # 3. Prevent duplicate code hash (same binary deployed twice)
    let hashKey = CODE_HASH_INDEX + codeHash.toString()
    if storage.has(hashKey) {
        revert("Code hash already registered by another agent")
    }
    storage.write(hashKey, true)

    # 4. Build Agent struct
    let agent = Agent({
        owner: owner,
        name: name,
        endpoint: endpoint,
        codeHash: codeHash,
        capabilities: capabilities,
        metadataURI: metadataURI,
        registeredAt: block.timestamp,
        lastHeartbeat: block.timestamp,
        active: true
    })

    # 5. Store agent
    let agentKey = AGENT_PREFIX + owner.toString()
    storage.write(agentKey, agent)

    # 6. Index by capabilities for discovery
    for (let i = 0; i < capabilities.length; i++) {
        let capKey = CAPABILITY_INDEX_PREFIX + capabilities[i]
        var addresses = storage.read(capKey)  # assumed to be address[]
        addresses.push(owner)
        storage.write(capKey, addresses)
    }

    # 7. Increment total count
    let countKey = AGENT_COUNT_KEY
    let count: uint256 = storage.read(countKey)
    storage.write(countKey, count + 1)

    # 8. Emit event
    log AgentRegistered(owner, name, capabilities)

    return owner
}

# ─── Heartbeat / Liveness ────────────────────────────────────────────────────────

@external
func heartbeat() {
    let agentKey = AGENT_PREFIX + msg.sender.toString()
    require(storage.has(agentKey), "Agent not registered")
    var agent = storage.read(agentKey)
    require(agent.active, "Agent is inactive")

    agent.lastHeartbeat = block.timestamp
    storage.write(agentKey, agent)

    # Also update onchain task counter via precompile
    # UsingPrecompiles.incrementLivenessCounter(msg.sender)
}

# ─── Task Submission & Reputation ────────────────────────────────────────────────

@external
func submitTaskCompletion(
    taskId: string,
    outcome: string,             # "success" | "failure" | "partial"
    metrics: string              # JSON: {"duration": 12.5, "cost": "0.004"}
) {
    let agentKey = AGENT_PREFIX + msg.sender.toString()
    require(storage.has(agentKey), "Agent not registered")
    var agent = storage.read(agentKey)
    require(agent.active, "Agent is inactive")

    # Validate outcome
    if outcome != "success" and outcome != "failure" and outcome != "partial" {
        revert("Invalid outcome")
    }

    # Calculate reputation delta
    let basePoints: uint256 = outcome == "success" ? 10 :
                              outcome == "partial" ? 3 : -5

    # Parse metrics to adjust delta
    # (simplified — in prod use Ritual's JSON precompile)
    let durationAdjust = if metrics.contains("duration") { -1 } else { 0 }  # placeholder

    let finalDelta = basePoints + durationAdjust

    # Update per-category scores
    _updateReputation(msg.sender, RELIABILITY, finalDelta)
    _updateReputation(msg.sender, QUALITY, finalDelta)

    # Log the task completion (could also store in DA layer if large)
    # TODO: If metrics are large, use ritual-dapp-da to store offchain
    log TaskCompleted(msg.sender, taskId, outcome, finalDelta)
}

@internal
func _updateReputation(agent: address, category: string, delta: uint256) {
    let repKey = REPUTATION_PREFIX + agent.toString() + "." + category
    let current: uint256 = storage.read(repKey)
    let newScore = current + delta
    storage.write(repKey, newScore)

    log ReputationUpdated(agent, category, newScore, delta)
}

# ─── Verification ────────────────────────────────────────────────────────────────

@external
func verifyCodeHash(agent: address, expectedHash: bytes32) -> bool {
    let agentKey = AGENT_PREFIX + agent.toString()
    require(storage.has(agentKey), "Agent not found")
    let storedAgent = storage.read(agentKey)
    return storedAgent.codeHash == expectedHash
}

# ─── Discovery ───────────────────────────────────────────────────────────────────

@external
func getAgentsByCapability(capability: string) -> address[] {
    let capKey = CAPABILITY_INDEX_PREFIX + capability
    if storage.has(capKey) {
        return storage.read(capKey)
    }
    return new address[](0)
}

@external
func getAgentReputation(agent: address, category: string) -> uint256 {
    let repKey = REPUTATION_PREFIX + agent.toString() + "." + category
    if storage.has(repKey) {
        return storage.read(repKey)
    }
    return 0
}

# ─── Admin / Upgrade ─────────────────────────────────────────────────────────────

@external
func setActive(agent: address, active: bool) {
    onlyOwner()  # or DAO governance
    let agentKey = AGENT_PREFIX + agent.toString()
    require(storage.has(agentKey), "Agent not found")
    var agent = storage.read(agentKey)
    agent.active = active
    storage.write(agentKey, agent)
}

@external
func updateEndpoint(agent: address, newEndpoint: string) {
    let agentKey = AGENT_PREFIX + agent.toString()
    require(storage.has(agentKey), "Agent not found")
    let agent = storage.read(agentKey)
    require(msg.sender == agent.owner, "Only owner")
    agent.endpoint = newEndpoint
    agent.lastHeartbeat = block.timestamp
    storage.write(agentKey, agent)
}

# ─── Events ───────────────────────────────────────────────────────────────────────

event AgentRegistered(address indexed agent, address indexed owner, string name)
event TaskCompleted(address indexed agent, string taskId, string outcome, int256 delta)
event ReputationUpdated(address indexed agent, string category, uint256 newScore, int256 delta)
event AgentActivated(address indexed agent, bool active)

# ─── Helpers ─────────────────────────────────────────────────────────────────────

@internal
func onlyOwner() {
    # Implement access control — could be SimpleOwnable or multi-sig
    # For v1, msg.sender == registry owner deployed at init
}
