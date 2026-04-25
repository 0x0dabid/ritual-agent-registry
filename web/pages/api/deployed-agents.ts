import type { NextApiRequest, NextApiResponse } from 'next';

const EXPLORER = 'https://explorer.ritual.network';

// Ritual precompile addresses: 0x0000...0800 through 0x0000...082F
const isRitualPrecompile = (addr: string) =>
  /^0x0{37}0*08[0-2][0-9a-f]$/i.test(addr.toLowerCase().padStart(42, '0'));

async function hasPrecompileInteraction(contractAddress: string): Promise<boolean> {
  try {
    // Try Blockscout v2 first
    const v2 = await fetch(
      `${EXPLORER}/api/v2/addresses/${contractAddress}/internal-transactions?limit=50`
    );
    if (v2.ok) {
      const data = await v2.json();
      const items = data.items ?? [];
      return items.some((tx: any) => isRitualPrecompile(tx.to?.hash ?? tx.to ?? ''));
    }
  } catch { /* fall through */ }

  try {
    // Blockscout v1 fallback
    const v1 = await fetch(
      `${EXPLORER}/api?module=account&action=txlistinternal&address=${contractAddress}`
    );
    const data = await v1.json();
    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result.some((tx: any) => isRitualPrecompile(tx.to ?? ''));
    }
  } catch { /* fall through */ }

  return false;
}

async function getDeployedContracts(walletAddress: string) {
  // Try Blockscout v2
  try {
    const v2 = await fetch(
      `${EXPLORER}/api/v2/addresses/${walletAddress}/transactions?filter=to%3Anull&limit=50`
    );
    if (v2.ok) {
      const data = await v2.json();
      const items: any[] = data.items ?? [];
      return items
        .filter((tx: any) => tx.created_contract?.hash)
        .map((tx: any) => ({
          address: tx.created_contract.hash,
          txHash: tx.hash,
          blockNumber: String(tx.block),
          timestamp: String(Math.floor(new Date(tx.timestamp).getTime() / 1000)),
        }));
    }
  } catch { /* fall through */ }

  // Blockscout v1 fallback
  const v1 = await fetch(
    `${EXPLORER}/api?module=account&action=txlist&address=${walletAddress}&sort=desc`
  );
  const data = await v1.json();
  if (data.status !== '1' || !Array.isArray(data.result)) return [];
  return data.result
    .filter((tx: any) => tx.contractAddress && tx.contractAddress !== '')
    .map((tx: any) => ({
      address: tx.contractAddress,
      txHash: tx.hash,
      blockNumber: tx.blockNumber,
      timestamp: tx.timeStamp,
    }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Missing address' });
  }

  try {
    const deployed = await getDeployedContracts(address);
    const checks = await Promise.all(deployed.map(c => hasPrecompileInteraction(c.address)));
    const agents = deployed.filter((_, i) => checks[i]);
    res.status(200).json({ agents });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Explorer unreachable' });
  }
}
