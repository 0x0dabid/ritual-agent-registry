"use client";

import { useState } from 'react';
import { useAccount, useConnect, useWalletClient } from 'wagmi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { agentRegistryAbi, publicClient, ritualChain } from '../../lib/ritual';

const EMPTY_CODE_HASH = `0x${'0'.repeat(64)}` as `0x${string}`;
const EXPLORER = 'https://explorer.ritualfoundation.org';

interface DeployedContract {
  address: string;
  txHash: string;
  blockNumber: string;
  timestamp: string;
}

const isRitualPrecompile = (addr: string) =>
  /^0x0{37}0*08[0-2][0-9a-f]$/i.test(addr.toLowerCase().padStart(42, '0'));

async function checkPrecompileInteraction(contractAddress: string): Promise<boolean> {
  try {
    const res = await fetch(`${EXPLORER}/api/v2/addresses/${contractAddress}/internal-transactions?limit=50`);
    if (res.ok) {
      const data = await res.json();
      return (data.items ?? []).some((tx: any) => isRitualPrecompile(tx.to?.hash ?? tx.to ?? ''));
    }
  } catch {}
  try {
    const res = await fetch(`${EXPLORER}/api?module=account&action=txlistinternal&address=${contractAddress}`);
    const data = await res.json();
    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result.some((tx: any) => isRitualPrecompile(tx.to ?? ''));
    }
  } catch {}
  return false;
}

async function fetchDeployedAgents(walletAddress: string): Promise<DeployedContract[]> {
  // Call explorer directly from browser — avoids Vercel server IPs being blocked
  try {
    const v2 = await fetch(`${EXPLORER}/api/v2/addresses/${walletAddress}/transactions?filter=to%3Anull&limit=50`);
    if (v2.ok) {
      const data = await v2.json();
      const items: any[] = data.items ?? [];
      const contracts = items
        .filter((tx: any) => tx.created_contract?.hash)
        .map((tx: any) => ({
          address: tx.created_contract.hash,
          txHash: tx.hash,
          blockNumber: String(tx.block),
          timestamp: String(Math.floor(new Date(tx.timestamp).getTime() / 1000)),
        }));
      const checks = await Promise.all(contracts.map(c => checkPrecompileInteraction(c.address)));
      return contracts.filter((_, i) => checks[i]);
    }
  } catch {}

  // Blockscout v1 fallback
  try {
    const v1 = await fetch(`${EXPLORER}/api?module=account&action=txlist&address=${walletAddress}&sort=desc`);
    const data = await v1.json();
    if (data.status === '1' && Array.isArray(data.result)) {
      const contracts = data.result
        .filter((tx: any) => tx.contractAddress && tx.contractAddress !== '')
        .map((tx: any) => ({
          address: tx.contractAddress,
          txHash: tx.hash,
          blockNumber: tx.blockNumber,
          timestamp: tx.timeStamp,
        }));
      const checks = await Promise.all(contracts.map((c: DeployedContract) => checkPrecompileInteraction(c.address)));
      return contracts.filter((_: any, i: number) => checks[i]);
    }
  } catch {}

  throw new Error('Could not reach the Ritual Chain explorer. Enter your agent contract address manually below.');
}

export default function RegisterAgentPage() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();

  const [name, setName] = useState('');
  const [selected, setSelected] = useState<DeployedContract | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [contracts, setContracts] = useState<DeployedContract[] | null>(null);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState('');

  const handleLoad = async () => {
    if (!address) return;
    setLoadingContracts(true);
    setContracts(null);
    setLoadError(null);
    setSelected(null);
    try {
      const result = await fetchDeployedAgents(address);
      setContracts(result);
    } catch (err: any) {
      setLoadError(err?.message ?? 'Could not reach the Ritual Chain explorer.');
      setContracts([]);
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleManualSelect = () => {
    const addr = manualAddress.trim();
    if (!addr.match(/^0x[0-9a-fA-F]{40}$/)) return;
    setSelected({ address: addr, txHash: '', blockNumber: '', timestamp: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletClient || !address || !selected) return;

    setSubmitting(true);
    setError(null);

    try {
      const contractAddress = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS! as `0x${string}`;
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: agentRegistryAbi,
        functionName: 'registerAgent',
        chain: ritualChain,
        args: [name, selected.address, EMPTY_CODE_HASH, [], ''],
      });
      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setSubmitting(false);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-ritual-black flex items-center justify-center p-4">
        <div className="bg-ritual-elevated border border-gray-800 rounded-xl p-8 max-w-md w-full text-center shadow-card">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-ritual-green/10 border border-ritual-green/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-ritual-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-300 mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-8">Connect your wallet to register an agent on Ritual Chain.</p>
          <button
            onClick={() => {
              const injected = connectors.find(c => c.id === 'injected');
              if (injected) connect({ connector: injected });
              else if (connectors[0]) connect({ connector: connectors[0] });
            }}
            className="w-full btn-primary"
          >
            Connect Wallet
          </button>
          <p className="text-xs text-gray-600 mt-6">Chain ID {process.env.NEXT_PUBLIC_RITUAL_CHAIN_ID || '1979'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ritual-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-ritual-green transition-colors text-sm mb-8 group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to registry
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-ritual-lime mb-3">Register Agent</h1>
          <p className="text-gray-400">Load your deployed contracts from Ritual Chain, pick one, and register it.</p>
        </div>

        <div className="space-y-4">

          {/* Step 1 — Wallet + Load */}
          <div className="bg-ritual-elevated border border-gray-800 rounded-xl p-6 shadow-card">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Step 1 — Your Wallet</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 bg-ritual-surface border border-gray-800 rounded-lg font-mono text-sm text-ritual-lime truncate">
                {address}
              </div>
              <button
                onClick={handleLoad}
                disabled={loadingContracts}
                className="flex-shrink-0 btn-secondary text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {loadingContracts
                  ? <div className="w-4 h-4 border-2 border-ritual-pink border-t-transparent rounded-full animate-spin" />
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                }
                Load My Agents
              </button>
            </div>
          </div>

          {/* Step 2 — Pick a deployed contract */}
          {contracts !== null && (
            <div className="bg-ritual-elevated border border-gray-800 rounded-xl p-6 shadow-card">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                Step 2 — Select a Deployed Agent
              </p>

              {loadError && (
                <div className="mb-4">
                  <p className="text-red-400 text-sm mb-4">{loadError}</p>
                  {/* Manual address fallback */}
                  <div className="bg-ritual-surface border border-gray-700 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Enter Contract Address Manually</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualAddress}
                        onChange={e => setManualAddress(e.target.value)}
                        placeholder="0x..."
                        className="input-field flex-1 font-mono text-sm"
                      />
                      <button
                        onClick={handleManualSelect}
                        disabled={!manualAddress.match(/^0x[0-9a-fA-F]{40}$/)}
                        className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        Use
                      </button>
                    </div>
                    <a
                      href={`https://explorer.ritualfoundation.org/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ritual-green text-xs font-mono hover:underline mt-3 inline-block"
                    >
                      Find your contracts on explorer →
                    </a>
                  </div>
                </div>
              )}

              {contracts.length === 0 && !loadError ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No Ritual agent contracts found for this wallet. Deploy an agent contract that calls a Ritual precompile first.</p>
                  <a
                    href={`https://explorer.ritualfoundation.org/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ritual-green text-xs font-mono hover:underline mt-2 inline-block"
                  >
                    View on explorer →
                  </a>
                </div>
              ) : !loadError && (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {contracts.map(contract => (
                    <button
                      key={contract.address}
                      onClick={() => setSelected(contract)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selected?.address === contract.address
                          ? 'border-ritual-green/50 bg-ritual-green/5'
                          : 'border-gray-800 hover:border-gray-600 bg-ritual-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm text-ritual-lime">
                            {contract.address.slice(0, 10)}...{contract.address.slice(-8)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Block #{contract.blockNumber} · {new Date(Number(contract.timestamp) * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        {selected?.address === contract.address && (
                          <svg className="w-5 h-5 text-ritual-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Name + Register */}
          {selected && (
            <div className="bg-ritual-elevated border border-gray-800 rounded-xl p-6 shadow-card">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-5">Step 3 — Name & Register</p>

              {error && (
                <div className="mb-5 bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {txHash && (
                <div className="mb-5 bg-ritual-green/10 border border-ritual-green/30 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ritual-green/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-ritual-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-ritual-green font-semibold mb-2">Agent registered!</p>
                  <p className="font-mono text-xs text-gray-400 break-all">{txHash}</p>
                  <p className="text-gray-500 text-sm mt-3">Redirecting...</p>
                </div>
              )}

              {/* Selected agent summary */}
              <div className="mb-5 px-4 py-3 bg-ritual-surface border border-ritual-green/20 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Selected Agent</p>
                <p className="font-mono text-sm text-ritual-lime break-all">{selected.address}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Agent Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., My AI Agent"
                    className="input-field"
                    disabled={submitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="w-full py-3 rounded-lg btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-ritual-green border-t-transparent rounded-full animate-spin" />
                      {txHash ? 'Confirming on-chain...' : 'Broadcasting...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Register Agent
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-600 text-center">Requires RITUAL for gas.</p>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
