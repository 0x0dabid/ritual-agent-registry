import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Agent, Reputation } from '../../lib/types';
import { getAgentByAddress, getReputation } from '../../lib/ritual';
import ReputationBar from '../../components/ReputationBar';
import CapabilityBadge from '../../components/CapabilityBadge';

export default function AgentDetailPage() {
  const router = useRouter();
  const { address } = router.query;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [reputation, setReputation] = useState<Reputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [codeVerified, setCodeVerified] = useState<boolean | null>(null);
  const [localCodeHash, setLocalCodeHash] = useState('');

  useEffect(() => {
    if (!address) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const agentData = await getAgentByAddress(address as string);
        if (!agentData) {
          setError('Agent not found on registry');
          setLoading(false);
          return;
        }
        setAgent(agentData);

        // Fetch reputation for all 4 categories
        const cats = ['reliability', 'speed', 'quality', 'cost-efficiency'];
        const rep: Reputation = {
          reliability: await getReputation(address as string, cats[0]),
          speed: await getReputation(address as string, cats[1]),
          quality: await getReputation(address as string, cats[2]),
          costEfficiency: await getReputation(address as string, cats[3]),
        };
        setReputation(rep);
      } catch (err: any) {
        setError(err.message || 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  const handleVerify = async () => {
    if (!localCodeHash || !agent) return;
    setVerifying(true);
    // Compare local hash with onchain
    const match = agent.codeHash ? localCodeHash.toLowerCase() === (agent.codeHash || '').toLowerCase() : false;
    setCodeVerified(match);
    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-ritual-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400">Loading agent data from Ritual Chain...</p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-red-400 text-4xl mb-4">404</div>
        <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
        <p className="text-gray-500 mb-8">{error}</p>
        <Link href="/" className="text-ritual-accent hover:underline">← Back to registry</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2 mb-8">
        ← Back to registry
      </Link>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{agent.name}</h1>
            <p className="font-mono text-gray-500 text-sm break-all">{agent.address}</p>
          </div>
          <div className="flex gap-3">
            <a
              href={`https://explorer.ritual.network/address/${agent.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition"
            >
              View on Explorer →
            </a>
            {agent.active ? (
              <span className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 text-sm font-medium">
                Active
              </span>
            ) : (
              <span className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm font-medium">
                Inactive
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-gray-500 text-sm mb-1">Owner</div>
            <div className="font-mono text-sm text-gray-300">
              {agent.owner.slice(0, 10)}...
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-gray-500 text-sm mb-1">Registered</div>
            <div className="text-gray-300">
              {new Date(agent.registeredAt * 1000).toLocaleDateString()}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-gray-500 text-sm mb-1">Last Seen</div>
            <div className="text-gray-300">
              {(agent.lastHeartbeat || 0) > 0
                ? `${Math.floor((Date.now() - (agent.lastHeartbeat || 0) * 1000) / 60000)}m ago`
                : 'Never'}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-gray-500 text-sm mb-1">Code Hash</div>
            <div className="font-mono text-xs text-gray-300 truncate">
              {(agent.codeHash || '').slice(0, 12)}...
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Capabilities</h2>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((cap) => (
              <CapabilityBadge key={cap} capability={cap} />
            ))}
          </div>
        </div>

        {/* Reputation */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Reputation Scores</h2>
          {reputation ? (
            <ReputationBar reputation={reputation} />
          ) : (
            <p className="text-gray-500 text-sm">No reputation data yet</p>
          )}
        </div>

        {/* Code Verification */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Code Verification</h2>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-3">
              Verify this agent's code matches the onchain hash. Upload the source file to compare.
            </p>
            <div className="flex items-start gap-4">
              <input
                type="file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  // Compute SHA-256
                  const encoder = new TextEncoder();
                  const data = encoder.encode(text);
                  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                  const hashHex = '0x' + Buffer.from(hashBuffer).toString('hex');
                  setLocalCodeHash(hashHex);
                }}
                className="block text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-ritual-accent file:text-black"
              />
              <button
                onClick={handleVerify}
                disabled={!localCodeHash || verifying}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-sm"
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            {codeVerified !== null && (
              <p className={`mt-3 text-sm font-medium ${codeVerified ? 'text-green-400' : 'text-red-400'}`}>
                {codeVerified ? '✓ Code hash matches onchain record' : '✗ MISMATCH — code has been modified!'}
              </p>
            )}
          </div>
        </div>

        {/* Endpoint & Metadata */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Endpoint</h2>
            <code className="block bg-gray-800 p-3 rounded-lg font-mono text-sm break-all">
              {agent.endpoint}
            </code>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Onchain Code Hash</h2>
            <code className="block bg-gray-800 p-3 rounded-lg font-mono text-sm break-all">
              {agent.codeHash}
            </code>
          </div>
          {(agent.metadataURI || '') && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Metadata URI</h2>
              <a
                href={agent.metadataURI || ''}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-800 p-3 rounded-lg font-mono text-sm break-all text-ritual-accent hover:underline"
              >
                {agent.metadataURI || ''}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
