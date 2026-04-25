import { createPublicClient, http, defineChain } from 'viem';
import type { Agent } from './types';

export const chainId = parseInt(process.env.NEXT_PUBLIC_RITUAL_CHAIN_ID || '11022', 10);
export const rpcUrl = process.env.NEXT_PUBLIC_RITUAL_RPC_URL || 'https://devnet.ritual.network';

export const ritualChain = defineChain({
  id: chainId,
  name: 'Ritual Devnet',
  nativeCurrency: { name: 'xRIT', symbol: 'xRIT', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
}) as any;

export const publicClient = createPublicClient({
  chain: ritualChain,
  transport: http(rpcUrl),
});

/**
 * ABI slice for reading Agent structs.
 */
export const agentRegistryAbi = [
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'agents',
    outputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'capabilities', type: 'string' },
      { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllAgents',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'capabilities', type: 'string' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
        ],
        internalType: 'struct AgentRegistry.Agent[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'addressToIndex',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'agentCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Fetch a single agent by index from the chain.
 */
export async function fetchAgent(contractAddress: string, index: bigint) {
  const raw = await (publicClient as any).readContract({
    address: contractAddress as `0x${string}`,
    abi: agentRegistryAbi,
    functionName: 'agents',
    args: [index],
  }) as any[];
  const [owner, name, capabilitiesRaw, createdAt] = raw;
  return {
    address: owner,
    owner,
    name,
    capabilities: (capabilitiesRaw || '').split(',').filter(Boolean),
    registeredAt: Number(createdAt),
    active: true,
  };
}

/**
 * Fetch all registered agents.
 */
export async function fetchAllAgents(contractAddress: string) {
  const raw = await (publicClient as any).readContract({
    address: contractAddress as `0x${string}`,
    abi: agentRegistryAbi,
    functionName: 'getAllAgents',
  }) as any[];
  return (raw || []).map((agent: any) => {
    const [owner, name, capabilitiesRaw, createdAt] = agent;
    return {
      address: owner,
      owner,
      name,
      capabilities: (capabilitiesRaw || '').split(',').filter(Boolean),
      registeredAt: Number(createdAt),
      active: true,
    };
  });
}

/**
 * Helper: get agent by owner address (looks up index from registry)
 */
export async function getAgentByAddress(agentAddress: string) {
  const contractAddress = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
  if (!contractAddress) throw new Error('NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS not set');
  const indexResult = await (publicClient as any).readContract({
    address: contractAddress as `0x${string}`,
    abi: agentRegistryAbi,
    functionName: 'addressToIndex',
    args: [agentAddress as `0x${string}`],
  }) as bigint;
  if (indexResult === BigInt(0)) return null;
  return fetchAgent(contractAddress, indexResult);
}

/**
 * Placeholder reputation — static score until on-chain reputation is added
 */
export async function getReputation(agentAddress: string, _category?: string): Promise<number> {
  const hash = BigInt('0x' + agentAddress.slice(2, 10));
  return Number(hash % BigInt(1000)) / 10;
}

/** Compute a keccak256 hash of code (placeholder — uses simple hash for demo) */
export async function computeCodeHash(code: string): Promise<string> {
  // In production: use keccak256 from viem or ethers
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = ((hash << 5) - hash) + code.charCodeAt(i);
    hash |= 0;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}

/** Get the AgentRegistry contract instance info */



/**
 * Get contract config with a registerAgent helper.
 * Caller must provide a walletClient with writeContract.
 */
export function getContract() {
  const address = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
  if (!address) throw new Error('NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS not set');
  return {
    address: address as `0x${string}`,
    abi: agentRegistryAbi,
    // Thin wrapper — caller supplies a viem WalletClient
    registerAgent: async (walletClient: any, name: string, endpoint: string, codeHash: string, capabilities: string[], metadataURI: string) => {
      return walletClient.writeContract({
        address: address as `0x${string}`,
        abi: agentRegistryAbi,
        functionName: 'registerAgent',
          args: [name, endpoint, codeHash, capabilities.join(','), metadataURI],
      });
    },
  };
}

export async function getAllAgents() {
  const addr = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
  if (!addr) throw new Error('NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS not set');
  return fetchAllAgents(addr);
}

/** Return agents filtered by a capability string (exact match) */
export async function getAgentsByCapability(capability: string) {
  const addr = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
  if (!addr) throw new Error('NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS not set');
  const agents = await fetchAllAgents(addr);
  return agents.filter(a => a.capabilities.includes(capability));
}
