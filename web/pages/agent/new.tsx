import { useState } from 'react';
import { useAccount, useConnect, useWalletClient } from 'wagmi';
import { useRouter } from 'next/router';
import { computeCodeHash, getContract } from '../../lib/ritual';
import CapabilityBadge from '../../components/CapabilityBadge';

const AVAILABLE_CAPS = [
  'llm-inference', 'video-generation', 'image-generation',
  'audio', 'manim', 'testing', 'http', 'multimodal',
  'text-gen', 'embedding', 'oracle', 'transcription',
  'whisper', 'stable-diffusion', 'telegram-notify'
];

export default function RegisterPage() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    endpoint: '',
    codeFile: null as File | null,
    capabilities: [] as string[],
    metadataURI: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    if (!isConnected || !address) {
      setError('Connect wallet first');
      return;
    }
    if (!form.codeFile) {
      setError('Upload agent code file');
      return;
    }
    if (form.capabilities.length === 0) {
      setError('Select at least one capability');
      return;
    }

    setSubmitting(true);

    try {
      // Compute code hash from file contents
      const codeText = await form.codeFile.text();
      const encoder = new TextEncoder();
      const data = encoder.encode(codeText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const codeHash = '0x' + Buffer.from(hashBuffer).toString('hex');

      // Call contract via wallet
      const registry = getContract();
      const tx = await registry.registerAgent(
        walletClient,
        form.name,
        form.endpoint,
        codeHash as `0x${string}`,
        form.capabilities,
        form.metadataURI || `ipfs://undefined`
      );

      setTxHash(tx);
      // Redirect to agent page after brief delay
      setTimeout(() => router.push(`/agent/${address}`), 2000);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Transaction failed');
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-400 mb-8">
          Connect your Ritual wallet to register an autonomous agent on the registry.
        </p>
        <button
          onClick={() => {
        const injected = connectors.find(c => c.id === 'injected');
        if (injected) connect({ connector: injected });
        else if (connectors[0]) connect({ connector: connectors[0] });
      }}
          className="px-6 py-3 rounded-lg bg-ritual-accent text-black font-medium hover:bg-lime-400"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Register New Agent</h1>
      <p className="text-gray-400 mb-8">
        Add your autonomous agent to the Ritual Agent Registry.
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {txHash && (
        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-6 mb-6">
          <p className="text-green-400 font-medium">✓ Agent registered successfully!</p>
          <p className="font-mono text-sm text-gray-300 mt-2 break-all">TX: {txHash}</p>
          <p className="text-gray-400 text-sm mt-2">
            Redirecting to agent page...
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Agent Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Video Renderer"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:border-ritual-accent focus:outline-none"
            disabled={submitting}
          />
        </div>

        {/* Endpoint */}
        <div>
          <label className="block text-sm font-medium mb-2">HTTP Endpoint URL</label>
          <input
            type="url"
            required
            value={form.endpoint}
            onChange={e => setForm({ ...form, endpoint: e.target.value })}
            placeholder="https://your-agent.com/api"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:border-ritual-accent focus:outline-none"
            disabled={submitting}
          />
          <p className="text-gray-500 text-sm mt-1">
            Must implement GET /health (200 OK) and POST /tasks
          </p>
        </div>

        {/* Code File */}
        <div>
          <label className="block text-sm font-medium mb-2">Agent Code File</label>
          <input
            type="file"
            accept=".py,.js,.ts,.rs,.go,.sol"
            onChange={e => setForm({ ...form, codeFile: e.target.files?.[0] || null })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-ritual-accent file:text-black"
            disabled={submitting}
          />
          <p className="text-gray-500 text-sm mt-1">
            SHA-256 hash of this file will be stored on-chain for verification.
          </p>
        </div>

        {/* Capabilities */}
        <div>
          <label className="block text-sm font-medium mb-2">Capabilities (select all that apply)</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CAPS.map(cap => (
              <button
                key={cap}
                type="button"
                onClick={() => toggleCap(cap)}
                disabled={submitting}
                className={`px-3 py-1 rounded-full text-sm border transition ${form.capabilities.includes(cap)
                  ? 'bg-ritual-accent text-black border-ritual-accent'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                }`}
              >
                {cap}
              </button>
            ))}
          </div>
        </div>

        {/* Metadata URI */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Metadata URI (optional)
          </label>
          <input
            type="text"
            value={form.metadataURI}
            onChange={e => setForm({ ...form, metadataURI: e.target.value })}
            placeholder="ipfs://Qm..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:border-ritual-accent focus:outline-none"
            disabled={submitting}
          />
          <p className="text-gray-500 text-sm mt-1">
            IPFS CID or HTTP URL with extended agent metadata
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !form.capabilities.length || !form.codeFile}
          className="w-full py-3 rounded-lg bg-ritual-accent text-black font-medium hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Registering...' : 'Register Agent'}
        </button>

        <p className="text-gray-500 text-xs text-center">
          Registering requires a Ritual wallet with sufficient RITUAL for gas.
        </p>
      </form>
    </div>
  );
}

// Helper to get contract instance (used inside useAccount context)
