"use client";

import { useState } from 'react';
import { useAccount, useConnect, useWalletClient } from 'wagmi';
import { useRouter } from 'next/router';
import { agentRegistryAbi, publicClient, ritualChain } from '../../lib/ritual';

const CAPABILITIES = [
  'llm-inference', 'video-generation', 'image-generation', 'audio',
  'manim', 'testing', 'http', 'multimodal', 'text-gen', 'embedding',
  'oracle', 'transcription', 'whisper', 'stable-diffusion', 'telegram-notify'
];

export default function RegisterAgentPage() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    endpoint: '',
    capabilities: [] as string[],
    metadataURI: '',
  });
  const [codeFile, setCodeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'hashing' | 'broadcasting' | 'confirming'>('idle');

  // Toggle capability
  const toggleCap = (cap: string) => {
    setForm(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  // Handle file hash calculation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setCodeFile(file);
      setError(null);
    }
  };

  // Compute SHA-256 hash of the file
  const computeFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletClient || !codeFile) return;

    setSubmitting(true);
    setError(null);
    setStep('hashing');

    try {
      // 1. Compute code hash
      const codeHash = await computeFileHash(codeFile);
      setStep('broadcasting');

      // 2. Prepare contract call
      const contractAddress = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS! as `0x${string}`;

      // 3. Send transaction via walletClient (viem)
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: agentRegistryAbi,
        functionName: 'registerAgent',
        chain: ritualChain,
        args: [
          form.name,
          form.endpoint,
          codeHash,
          form.capabilities,
          form.metadataURI || 'ipfs://QmPlaceholder'
        ],
      });
      setTxHash(txHash);
      setStep('confirming');

      // 4. Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setStep('idle');
      setSubmitting(false);

      // Redirect to agents list after brief delay
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Transaction failed');
      setStep('idle');
      setSubmitting(false);
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-ritual-black flex items-center justify-center p-4">
        <div className="bg-ritual-elevated border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-card">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-ritual-green/10 border border-ritual-green/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-ritual-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L12 17h-1.145A4.963 4.963 0 0012 14a4.963 4.963 0 00-4.855 2.855A4.963 4.963 0 0012 14z" />
            </svg>
          </div>

          <h1 className="text-2xl font-display font-bold text-gray-300 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Connect your Ritual wallet to register an autonomous agent on the registry.
            Your agent&apos;s code will be verified on-chain.
          </p>

          <button
            onClick={() => {
              const injected = connectors.find(c => c.id === 'injected');
              if (injected) connect({ connector: injected });
              else if (connectors[0]) connect({ connector: connectors[0] });
            }}
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-ritual-green text-black font-semibold hover:bg-ritual-green/90 transition-all focus:ring-2 focus:ring-ritual-green/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
          >
            Connect Wallet
          </button>

          <p className="text-xs text-gray-600 mt-6">
            Requires a wallet configured for Chain ID {process.env.NEXT_PUBLIC_RITUAL_CHAIN_ID || '1979'}
          </p>
        </div>
      </div>
    );
  }

  // Connected state
  return (
    <div className="min-h-screen bg-ritual-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-ritual-lime mb-3">
            Register New Agent
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Add your autonomous agent to the Ritual Agent Registry.
            The agent&apos;s code hash is stored on-chain for verification.
          </p>
        </div>

        {/* Registration form */}
        <div className="bg-ritual-elevated border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-card">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {txHash && (
            <div className="mb-6 bg-ritual-green/10 border border-ritual-green/30 rounded-lg p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ritual-green/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-ritual-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-ritual-green font-semibold mb-2">Agent registered successfully!</p>
              <p className="font-mono text-xs text-gray-400 break-all">{txHash}</p>
              <p className="text-gray-500 text-sm mt-3">Redirecting to home...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agent Name */}
            <div>
                <label className="block text-sm font-semibold text-ritual-green mb-2">
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
                <label className="block text-sm font-semibold text-ritual-green mb-2">
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
                Must implement GET /health (200 OK) and POST /tasks
              </p>
            </div>

            {/* Code File */}
            <div>
                <label className="block text-sm font-semibold text-ritual-green mb-2">
                Agent Code File
              </label>
              <input
                type="file"
                accept=".py,.js,.ts,.rs,.go,.sol"
                onChange={handleFileChange}
                className="w-full px-4 py-3 bg-ritual-surface border border-gray-700 rounded-lg text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-ritual-green file:text-black cursor-pointer"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-2">
                SHA-256 hash of this file will be stored on-chain for verification.
              </p>
            </div>

            {/* Capabilities */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Capabilities (select all that apply)
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

            {/* Metadata URI (optional) */}
            <div>
                <label className="block text-sm font-semibold text-ritual-green mb-2">
                Metadata URI (optional)
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

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !form.capabilities.length || !codeFile}
              className="w-full py-3 rounded-lg btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  {step === 'hashing' && 'Hashing code...'}
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

            {/* Gas notice */}
            <p className="text-xs text-gray-500 text-center">
              Registration requires sufficient RITUAL for gas.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
