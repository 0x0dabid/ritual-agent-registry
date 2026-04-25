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

export const agentRegistryAbi = [
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'getAgent',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'codeHash', type: 'bytes32' },
      { name: 'capabilities', type: 'string[]' },
      { name: 'metadataURI', type: 'string' },
      { name: 'registeredAt', type: 'uint64' },
      { name: 'lastHeartbeat', type: 'uint64' },
      { name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'index', type: 'uint256' }],
    name: 'getAgentAtIndex',
    outputs: [
      { name: 'agent', type: 'address' },
      { name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'agentCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'category', type: 'string' },
    ],
    name: 'getAgentReputation',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'codeHash', type: 'bytes32' },
      { name: 'capabilities', type: 'string[]' },
      { name: 'metadataURI', type: 'string' },
    ],
    name: 'registerAgent',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'heartbeat',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export async function fetchAgent(contractAddress: string, agentAddress: string): Promise<Agent> {
  const result = await (publicClient as any).readContract({
    address: contractAddress as `0x${string}`,
    abi: agentRegistryAbi,
    functionName: 'getAgent',
    args: [agentAddress as `0x${string}`],
  }) as any[];

  const [owner, name, endpoint, codeHash, capabilities, metadataURI, registeredAt, lastHeartbeat, active] = result;
  const codeHashHex = typeof codeHash === 'string'
    ? codeHash
    : ('0x' + Array.from(codeHash as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join(''));

  return {
    address: agentAddress,
    owner,
    name,
    endpoint,
    codeHash: codeHashHex,
    capabilities: Array.isArray(capabilities) ? capabilities : (capabilities || '').split(',').filter(Boolean),
    metadataURI,
    registeredAt: Number(registeredAt),
    lastHeartbeat: Number(lastHeartbeat),
    active,
  };
}

export async function fetchAllAgents(contractAddress: string): Promise<Agent[]> {
  const count = await (publicClient as any).readContract({
    address: contractAddress as `0x${string}`,
    abi: agentRegistryAbi,
    functionName: 'agentCount',
  }) as bigint;

  const addresses: string[] = [];
  for (let i = 0n; i < count; i++) {
    const [agentAddr, exists] = await (publicClient as any).readContract({
      address: contractAddress as `0x${string}`,
      abi: agentRegistryAbi,
      functionName: 'getAgentAtIndex',
      args: [i],
    }) as [string, boolean];
    if (exists) addresses.push(agentAddr);
  }

  return Promise.all(addresses.map(addr => fetchAgent(contractAddress, addr)));
}

export async function getAgentByAddress(agentAddress: string): Promise<Agent | null> {
  const contractAddress = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
  if (!contractAddress) throw new Error('NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS not set');
  try {
    return await fetchAgent(contractAddress, agentAddress);
  } catch {
    return null;
  }
}

export async function getReputation(agentAddress: string, category?: string): Promise<number> {
  const contractAddress = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
  if (!contractAddress) {
    const hash = BigInt('0x' + agentAddress.slice(2, 10));
    return Number(hash % BigInt(1000)) / 10;
  }
  try {
    const score = await (publicClient as any).readContract({
      address: contractAddress as `0x${string}`,
      abi: agentRegistryAbi,
      functionName: 'getAgentReputation',
      args: [agentAddress as `0x${string}`, category || 'reliability'],
    }) as bigint;
    return Number(score) / 10;
  } catch {
    const hash = BigInt('0x' + agentAddress.slice(2, 10));
    return Number(hash % BigInt(1000)) / 10;
  }
}

export async function getAllAgents(): Promise<Agent[]> {
  const addr = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
  if (!addr) throw new Error('NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS not set');
  return fetchAllAgents(addr);
}

export async function getAgentsByCapability(capability: string): Promise<Agent[]> {
  const agents = await getAllAgents();
  return agents.filter(a => a.capabilities.includes(capability));
}

export function getContract() {
  const address = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
  if (!address) throw new Error('NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS not set');
  return { address: address as `0x${string}`, abi: agentRegistryAbi };
}
