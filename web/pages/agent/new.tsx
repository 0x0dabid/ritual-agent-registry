"use client";

import { useState } from 'react';
import { useAccount, useConnect, useWalletClient } from 'wagmi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { agentRegistryAbi, publicClient, ritualChain } from '../../lib/ritual';

const CAPABILITIES = [
  'llm-inference', 'video-generation', 'image-generation', 'audio',
  'manim', 'testing', 'http', 'multimodal', 'text-gen', 'embedding',
  'oracle', 'transcription', 'whisper', 'stable-diffusion', 'telegram-notify'
];

const EMPTY_CODE_HASH = `0x${'0'.repeat(64)}` as `0x${string}`;

export default function RegisterAgentPage() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    endpoint: '',
    capabilities: [] as string[],
    metadataURI: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'broadcasting' | 'confirming'>('idle');

  const toggleCap = (cap: string) => {
    setForm(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletClient) return;

    setSubmitting(true);
    setError(null);
    setStep('broadcasting');

    try {
      const contractAddress = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS! as `0x${string}`;

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: agentRegistryAbi,
        functionName: 'registerAgent',
        chain: ritualChain,
        args: [
          form.name,
          form.endpoint,
          EMPTY_CODE_HASH,
          form.capabilities,
          form.metadataURI || '',
        ],
      });
      setTxHash(hash);
      setStep('confirming');

      await publicClient.waitForTransactionReceipt({ hash });

      setStep('idle');
      setSubmitting(false);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Transaction failed');
      setStep('idle');
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
          <h1 className="text-2xl font-display font-bold text-gray-300 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Connect your Ritual wallet to register an autonomous agent on the registry.
          </p>
          <button
            onClick={() => {
              const injected = connectors.find(c => c.id === 'injected');
              if (injected) connect({ connector: injected });
              else if (connectors[0]) connect({ connector: connectors[0] });
            }}
            className="w-full btn-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ritual-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Connect Wallet
          </button>
          <p className="text-xs text-gray-600 mt-6">
            Requires Chain ID {process.env.NEXT_PUBLIC_RITUAL_CHAIN_ID || '1979'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ritual-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-ritual-green transition-colors text-sm mb-8 group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to registry
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-ritual-lime mb-3">
            Register New Agent
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Add your autonomous agent to the Ritual Chain registry.
          </p>
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
              <p className="text-ritual-green font-semibold mb-2">Agent registered successfully!</p>
              <p className="font-mono text-xs text-gray-400 break-all">{txHash}</p>
              <p className="text-gray-500 text-sm mt-3">Redirecting to registry...</p>
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
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Video Renderer"
                className="input-field"
                disabled={submitting}
              />
            </div>

            {/* Endpoint URL */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                HTTP Endpoint URL
              </label>
              <input
                type="url"
                required
                value={form.endpoint}
                onChange={e => setForm({ ...form, endpoint: e.target.value })}
                placeholder="https://your-agent.com/api"
                className="input-field"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-2">
                Must implement <code className="text-ritual-lime">GET /health</code> and <code className="text-ritual-lime">POST /tasks</code>
              </p>
            </div>

            {/* Capabilities */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-3">
                Capabilities
              </label>
              <div className="flex flex-wrap gap-2">
                {CAPABILITIES.map(cap => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => toggleCap(cap)}
                    disabled={submitting}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      form.capabilities.includes(cap)
                        ? 'bg-ritual-pink/20 border-ritual-pink/40 text-ritual-pink'
                        : 'bg-ritual-surface border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            {/* Metadata URI */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                Metadata URI <span className="normal-case text-gray-600">(optional)</span>
              </label>
              <input
                type="text"
                value={form.metadataURI}
                onChange={e => setForm({ ...form, metadataURI: e.target.value })}
                placeholder="ipfs://Qm... or https://..."
                className="input-field"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-2">
                IPFS CID or HTTP URL with extended agent metadata
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !form.name || !form.endpoint || !form.capabilities.length}
              className="w-full py-3 rounded-lg btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-ritual-green border-t-transparent rounded-full animate-spin" />
                  {step === 'broadcasting' && 'Broadcasting transaction...'}
                  {step === 'confirming' && 'Confirming on-chain...'}
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

            <p className="text-xs text-gray-600 text-center">
              Registration requires sufficient RITUAL for gas.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
