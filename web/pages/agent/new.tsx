"use client";

import { useState } from 'react';
import { useAccount, useConnect, useWalletClient } from 'wagmi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { agentRegistryAbi, publicClient, ritualChain } from '../../lib/ritual';

const EMPTY_CODE_HASH = `0x${'0'.repeat(64)}` as `0x${string}`;

export default function RegisterAgentPage() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();

  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletClient || !address) return;

    setSubmitting(true);
    setError(null);

    try {
      const contractAddress = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS! as `0x${string}`;

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: agentRegistryAbi,
        functionName: 'registerAgent',
        chain: ritualChain,
        args: [name, address, EMPTY_CODE_HASH, [], ''],
      });
      setTxHash(hash);

      await publicClient.waitForTransactionReceipt({ hash });
      setSubmitting(false);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
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
          <p className="text-gray-400 mb-8 leading-relaxed">
            Connect your wallet to register an agent on Ritual Chain.
          </p>
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
          <p className="text-gray-400">Your wallet address is used as the agent identifier.</p>
        </div>

        <div className="bg-ritual-elevated border border-gray-800 rounded-xl p-6 sm:p-8 shadow-card">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {txHash && (
            <div className="mb-6 bg-ritual-green/10 border border-ritual-green/30 rounded-xl p-6 text-center">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agent Name */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                Agent Name
              </label>
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

            {/* Wallet address — read-only display */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                Wallet Address
              </label>
              <div className="w-full px-4 py-3 bg-ritual-surface border border-gray-800 rounded-lg font-mono text-sm text-ritual-lime break-all">
                {address}
              </div>
              <p className="text-xs text-gray-600 mt-2">Automatically used as your agent&apos;s identifier on-chain.</p>
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
      </div>
    </div>
  );
}
