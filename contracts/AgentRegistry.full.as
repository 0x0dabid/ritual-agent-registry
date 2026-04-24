// Ritual Agent Registry — Main Contract with Enumeration Support
// AssemblyScript for Ritual Chain Precompiles

AGENT_COUNT_KEY = bytes32("agent-registry.count")
AGENT_ARRAY_BASE = bytes32("agent.array.")
AGENT_PREFIX = bytes32("agent.")
CAPABILITY_BASE = bytes32("capability.")
REPUTATION_BASE = bytes32("reputation.")
CODE_HASH_BASE = bytes32("code-hash.")

RELIABILITY = "reliability"
SPEED = "speed"
QUALITY = "quality"
COST = "cost-efficiency"

struct Agent {
    owner: address
    name: string
    endpoint: string
    codeHash: bytes32
    capabilities: string[]
    metadataURI: string
    registeredAt: uint64
    lastHeartbeat: uint64
    active: bool
}

@internal
func _agentKey(agent: address) -> bytes32 {
    return AGENT_PREFIX + agent.toString()
}

@internal
func _capabilityKey(cap: string) -> bytes32 {
    return CAPABILITY_BASE + cap
}

@internal
func _reputationKey(agent: address, category: string) -> bytes32 {
    return REPUTATION_BASE + agent.toString() + "." + category
}

@internal
func _codeHashKey(hash: bytes32) -> bytes32 {
    return CODE_HASH_BASE + hash.toString()
}

@external
func getAgent(agent: address) -> Agent {
    let key = _agentKey(agent)
    require(storage.has(key), "Agent not found")
    return storage.read(key)
}

@external
func agentExists(agent: address) -> bool {
    return storage.has(_agentKey(agent))
}

@external
func getAgentCount() -> uint256 {
    let key = AGENT_COUNT_KEY
    if storage.has(key) { return storage.read(key) }
    return 0
}

@external
func getAgentAtIndex(index: uint256) -> (address, bool) {
    let key = AGENT_ARRAY_BASE + index.toString()
    if storage.has(key) { return (storage.read(key), true) }
    return (address(0), false)
}

@external
func getAgentsByCapability(capability: string) -> address[] {
    let key = _capabilityKey(capability)
    if storage.has(key) { return storage.read(key) }
    return new address[](0)
}

@external
func getAgentReputation(agent: address, category: string) -> uint256 {
    let key = _reputationKey(agent, category)
    if storage.has(key) { return storage.read(key) }
    return 0
}

@external
func isCodeHashRegistered(hash: bytes32) -> bool {
    return storage.has(_codeHashKey(hash))
}

@external
func registerAgent(
    name: string,
    endpoint: string,
    codeHash: bytes32,
    capabilities: string[],
    metadataURI: string
) -> address {
    let owner = msg.sender
    if storage.has(_agentKey(owner)) { revert("Agent already registered") }
    if storage.has(_codeHashKey(codeHash)) { revert("Code hash duplicate") }
    storage.write(_codeHashKey(codeHash), true)

    let agent = Agent({
        owner: owner, name: name, endpoint: endpoint,
        codeHash: codeHash, capabilities: capabilities,
        metadataURI: metadataURI,
        registeredAt: block.timestamp,
        lastHeartbeat: block.timestamp,
        active: true
    })
    storage.write(_agentKey(owner), agent)

    let oldCount = getAgentCount()
    storage.write(AGENT_ARRAY_BASE + oldCount.toString(), owner)
    storage.write(AGENT_COUNT_KEY, oldCount + 1)

    for (let i = 0; i < capabilities.length; i++) {
        let capKey = _capabilityKey(capabilities[i])
        var list: address[] = storage.read(capKey)
        list.push(owner)
        storage.write(capKey, list)
    }

    log AgentRegistered(owner, owner, name, capabilities)
    return owner
}

@external
func heartbeat() {
    let key = _agentKey(msg.sender)
    require(storage.has(key), "Not registered")
    var a = storage.read(key)
    require(a.active, "Inactive")
    a.lastHeartbeat = block.timestamp
    storage.write(key, a)
}

@external
func submitTaskCompletion(taskId: string, outcome: string, metrics: string) {
    let key = _agentKey(msg.sender)
    require(storage.has(key), "Not registered")
    var a = storage.read(key)
    require(a.active, "Inactive")
    require(outcome == "success" || outcome == "partial" || outcome == "failure", "Bad outcome")

    let base: int256 = outcome == "success" ? 10 : outcome == "partial" ? 3 : -5
    _addReputation(msg.sender, RELIABILITY, base)
    _addReputation(msg.sender, QUALITY, base)
    log TaskCompleted(msg.sender, taskId, outcome, base)
}

@internal
func _addReputation(agent: address, category: string, delta: int256) {
    let key = _reputationKey(agent, category)
    var cur: uint256 = 0
    if storage.has(key) { cur = storage.read(key) }
    let newSigned = cur.toInt256() + delta
    storage.write(key, newSigned < 0 ? 0 : newSigned.toUint256())
    log ReputationUpdated(agent, category, storage.read(key), delta)
}

@external
func setActive(agent: address, active: bool) {
    let key = _agentKey(agent)
    require(storage.has(key), "Not found")
    var a = storage.read(key)
    a.active = active
    storage.write(key, a)
    log AgentActivated(agent, active)
}

@external
func updateEndpoint(agent: address, newEndpoint: string) {
    let key = _agentKey(agent)
    require(storage.has(key), "Not found")
    var a = storage.read(key)
    require(msg.sender == a.owner, "Not owner")
    a.endpoint = newEndpoint
    a.lastHeartbeat = block.timestamp
    storage.write(key, a)
}

event AgentRegistered(address indexed agent, address indexed owner, string name, string[] capabilities)
event TaskCompleted(address indexed agent, string taskId, string outcome, int256 delta)
event ReputationUpdated(address indexed agent, string category, uint256 newScore, int256 delta)
event AgentActivated(address indexed agent, bool active)

receive() external payable { revert("No payable") }
