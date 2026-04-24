# Agent Registry Contract — Updated with Enumeration Support
# Storage layout additions for efficient agent listing

# Add to existing AgentRegistry.as:

# Additional storage keys
AGENT_ARRAY_KEY = bytes32("agent.array")      # address[] stored as sequential keys
AGENT_COUNT_KEY = bytes32("agent-registry.count")  # total count (already defined)

# ─── Enumeration Helpers ────────────────────────────────────────────────────────

@external
func getAgentCount() -> uint256 {
    # Return total number of registered agents
    let countKey = AGENT_COUNT_KEY
    if storage.has(countKey) {
        return storage.read(countKey)
    }
    return 0
}

@external
func getAgentAtIndex(index: uint256) -> (address, bool):
    # Retrieve agent address at given index for pagination
    let arrayBase = AGENT_ARRAY_KEY
    let indexKey = arrayBase + index.toString()

    if storage.has(indexKey):
        let agentAddr = storage.read(indexKey)
        return (agentAddr, true)
    return (address(0), false)

# ─── Modified registerAgent to maintain array ───────────────────────────────────

@external
func registerAgent(
    name: string,
    endpoint: string,
    codeHash: bytes32,
    capabilities: string[],
    metadataURI: string
) -> address {
    # ... existing validation ...

    # Build Agent struct
    let agent = Agent({ ... })

    # Store agent struct
    let agentKey = AGENT_PREFIX + owner.toString()
    storage.write(agentKey, agent)

    # ── NEW: Append to agent array for enumeration ─────────────────────────────
    let countKey = AGENT_COUNT_KEY
    let oldCount: uint256 = storage.read(countKey)
    let newIndexKey = AGENT_ARRAY_KEY + oldCount.toString()
    storage.write(newIndexKey, owner)
    storage.write(countKey, oldCount + 1)
    # ─────────────────────────────────────────────────────────────────────────────

    # ... rest unchanged ...
}

# ─── Pagination Helper ──────────────────────────────────────────────────────────

@external
func getAgentsPage(
    offset: uint256,
    limit: uint256
) -> address[] {
    let count = getAgentCount()
    let end = offset + limit
    if end > count {
        end = count
    }

    var result: address[] = new address[](limit)
    for (let i = offset; i < end; i++) {
        let (agentAddr, exists) = getAgentAtIndex(i)
        if exists {
            result[i - offset] = agentAddr
        } else {
            result[i - offset] = address(0)
        }
    }
    return result
}
