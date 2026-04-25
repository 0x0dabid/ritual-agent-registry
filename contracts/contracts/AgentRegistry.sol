// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgentRegistry
/// @notice Minimal agent registry for Ritual Chain. Pure Solidity — no
///         AssemblyScript toolchain required. Works with standard Hardhat + Foundry.
/// @dev The contract stores: each agent struct, reputation scores, and a capability index.
///      All storage keys collide with standard EVM layout so it's compatible with
///      Ritual's EVM layer (the precompiles are orthogonal and left unused here).

contract AgentRegistry {
    /* ══════════  Events  ══════════ */
    event AgentRegistered(
        address indexed agent,
        address indexed owner,
        string  name,
        string  endpoint,
        bytes32 codeHash
    );
    event AgentUpdated(address indexed agent, string name, string endpoint);
    event AgentHeartbeat(address indexed agent, uint256 timestamp);
    event TaskCompleted(
        bytes32 indexed taskId,
        address indexed agent,
        string  outcome,        // "success" | "partial" | "failure"
        int256  scoreDelta,
        string  reason
    );

    /* ══════════  Types  ══════════ */
    struct Agent {
        address  owner;
        string   name;
        string   endpoint;       // HTTP URL or DID string
        bytes32  codeHash;       // Keccak256 / SHA256 of agent binary
        string[] capabilities;   // tags like ["nlp", "image-gen"]
        string   metadataURI;    // IPFS CID or HTTP URL with extended metadata
        uint64   registeredAt;
        uint64   lastHeartbeat;
        bool     active;
    }

    struct Reputation {
        uint256 reliability;  // cumulative successful tasks
        uint256 speed;        // n tasks finished rapidly (time-weighted)
        uint256 quality;      // peer review score sum
        uint256 cost;         // tasks-per-wei efficiency
    }

    /* ══════════  Storage  ══════════ */
    uint256 public agentCount;

    mapping(address => Agent)     public agents;
    mapping(address => Reputation) public reputation;

    // capability string keccak256(capability) => [agent addresses]
    mapping(bytes32 => address[]) private capabilityIndex;

    // code-hash dedup: keccak256(abi.encodePacked("ch:", codeHash)) => bool
    mapping(bytes32 => bool) private codeHashSeen;

    /* ══════════  Modifiers  ══════════ */
    modifier onlyActiveAgent() {
        require(bytes(agents[msg.sender].name).length > 0, "Agent not registered");
        require(agents[msg.sender].active, "Agent is inactive");
        _;
    }

    /* ══════════  Registration  ══════════ */

    /// @notice Register a new agent. Fails if address already active or codeHash reused.
    /// @return agentAddr Always equals msg.sender.
    function registerAgent(
        string calldata name,
        string calldata endpoint,
        bytes32  codeHash,
        string[] calldata capabilities,
        string  calldata metadataURI
    ) external returns (address) {  // Self-register check done manually in-body for clarity
        address agentAddr = msg.sender;

        // Idempotency — agent already exists?
        require(bytes(agents[agentAddr].name).length == 0, "Agent already registered");

        // Duplicate binary guard
        bytes32 hashKey = keccak256(abi.encodePacked("ch:", codeHash));
        require(!codeHashSeen[hashKey], "Code hash already used");
        codeHashSeen[hashKey] = true;

        // Write agent struct
        Agent storage a = agents[agentAddr];
        a.owner         = msg.sender;
        a.name          = name;
        a.endpoint      = endpoint;
        a.codeHash      = codeHash;
        a.metadataURI   = metadataURI;
        a.registeredAt  = uint64(block.timestamp);
        a.lastHeartbeat = uint64(block.timestamp);
        a.active        = true;

        // Copy capabilities array from calldata to storage (cannot assign directly)
        for (uint256 i = 0; i < capabilities.length; i++) {
            a.capabilities.push(capabilities[i]);
            // Also index by capability for discovery
            bytes32 capKey = keccak256(bytes(capabilities[i]));
            capabilityIndex[capKey].push(agentAddr);
        }

        agentCount++;
        emit AgentRegistered(agentAddr, msg.sender, name, endpoint, codeHash);
        return agentAddr;
    }

    /* ══════════  Liveness  ══════════ */

    /// @notice Refresh heartbeat to signal agent is alive. Anyone may call on-behalf,
    ///         but emits event attributed to msg.sender.
    function heartbeat() external onlyActiveAgent {
        agents[msg.sender].lastHeartbeat = uint64(block.timestamp);
        emit AgentHeartbeat(msg.sender, block.timestamp);
    }

    /* ══════════  Reputation  ══════════ */

    /// @notice Submit task-result for scoring.
    /// @param taskId Arbitrary UUID or on-chain generated ID.
    /// @param outcome One of: "success", "partial", "failure".
    /// @param scoreDelta Signed integer: positive for reward, negative for penalty.
    /// @param reason Off-chain explanation (max 256 chars suggested).
    function submitTaskCompletion(
        bytes32 taskId,
        string  calldata outcome,
        int256  scoreDelta,
        string  calldata reason
    ) external onlyActiveAgent {
        // Map string outcome to category buckets
        bytes32 oc = keccak256(bytes(outcome));
        Reputation storage r = reputation[msg.sender];

        if (oc == keccak256("success")) {
            if (scoreDelta > 0) {
                r.reliability += uint256(scoreDelta);
                r.quality    += uint256(scoreDelta);
            }
        } else if (oc == keccak256("partial")) {
            if (scoreDelta > 0) r.reliability += uint256(scoreDelta / 2);
        } else if (oc == keccak256("failure")) {
            if (scoreDelta < 0) r.reliability -= uint256(-scoreDelta);
        } else {
            revert("Invalid outcome");
        }

        emit TaskCompleted(taskId, msg.sender, outcome, scoreDelta, reason);
    }

    /// @notice DAO/governance direct adjustment to a specific category. Extend with ACL!
    function adminAdjustReputation(
        address agent,
        string  calldata category,
        int256  delta
    ) external {
        Reputation storage r = reputation[agent];
        bytes32 catKey = keccak256(bytes(category));

        if (catKey == keccak256("reliability")) {
            r.reliability = delta > 0 ? r.reliability + uint256(delta) : r.reliability - uint256(-delta);
        } else if (catKey == keccak256("speed")) {
            r.speed = delta > 0 ? r.speed + uint256(delta) : r.speed - uint256(-delta);
        } else if (catKey == keccak256("quality")) {
            r.quality = delta > 0 ? r.quality + uint256(delta) : r.quality - uint256(-delta);
        } else if (catKey == keccak256("cost")) {
            r.cost = delta > 0 ? r.cost + uint256(delta) : r.cost - uint256(-delta);
        } else {
            revert("Unknown category");
        }
    }

    /* ══════════  Discovery  ══════════ */

    /// @notice Get all agent addresses that advertised a given capability.
    function findAgentsByCapability(string calldata capability) external view returns (address[] memory) {
        bytes32 capKey = keccak256(bytes(capability));
        return capabilityIndex[capKey];
    }

    /// @notice Convenience: also expose whether an agent is considered "live"
    ///         within the last `windowSec` seconds.
    function isLive(address agent, uint256 windowSec) external view returns (bool) {
        Agent memory a = agents[agent];
        if (a.lastHeartbeat == 0) return false;
        return (block.timestamp - a.lastHeartbeat) <= windowSec;
    }

    /* ══════════  Optional Extensions (future)  ══════════ */
    // Future: add agent de-registration (disable + refund deposit)
    // Future: add staking/bond to Sybil-resist
    // Future: add reputation decay over time
}
