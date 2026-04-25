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
    const match = agent.codeHash
      ? localCodeHash.toLowerCase() === agent.codeHash.toLowerCase()
      : false;
    setCodeVerified(match);
    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ritual-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-ritual-green border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 font-mono text-sm">Loading agent from Ritual Chain...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-ritual-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-ritual-pink font-mono text-6xl mb-4 font-display">404</div>
          <h1 className="text-2xl font-display font-bold text-gray-300 mb-4">Agent Not Found</h1>
          <p className="text-gray-500 mb-8">{error}</p>
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            ← Back to registry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ritual-black text-gray-300 font-body">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Back nav */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-ritual-green transition-colors text-sm mb-8 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to registry
        </Link>

        <div className="bg-ritual-elevated border border-gray-800 rounded-xl p-6 sm:p-8 shadow-card">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-ritual-lime mb-2" style={{ letterSpacing: '-0.01em' }}>
                {agent.name}
              </h1>
              <p className="font-mono text-xs text-gray-500 break-all">{agent.address}</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <a
                href={`https://explorer.ritual.network/address/${agent.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 text-sm font-medium transition-all"
              >
                Explorer →
              </a>
              {agent.active ? (
                <span className="badge badge-green flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-ritual-green animate-pulse-green" />
                  Active
                </span>
              ) : (
                <span className="badge badge-red">Inactive</span>
              )}
            </div>
          </div>

          <div className="section-divider mb-8" />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-ritual-surface rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Owner</div>
              <div className="font-mono text-xs text-ritual-lime">
                {agent.owner.slice(0, 8)}...{agent.owner.slice(-6)}
              </div>
            </div>
            <div className="bg-ritual-surface rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Registered</div>
              <div className="text-gray-300 text-sm">
                {new Date(agent.registeredAt * 1000).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-ritual-surface rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Last Seen</div>
              <div className="text-gray-300 text-sm">
                {(agent.lastHeartbeat || 0) > 0
                  ? `${Math.floor((Date.now() - (agent.lastHeartbeat || 0) * 1000) / 60000)}m ago`
                  : 'Never'}
              </div>
            </div>
            <div className="bg-ritual-surface rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Code Hash</div>
              <div className="font-mono text-xs text-gray-400 truncate">
                {(agent.codeHash || '').slice(0, 12)}...
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="mb-8">
            <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Capabilities</h2>
            <div className="flex flex-wrap gap-2">
              {agent.capabilities.map((cap) => (
                <CapabilityBadge key={cap} capability={cap} />
              ))}
            </div>
          </div>

          {/* Reputation */}
          <div className="mb-8">
            <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-4">Reputation Scores</h2>
            {reputation ? (
              <ReputationBar reputation={reputation} />
            ) : (
              <p className="text-gray-500 text-sm">No reputation data yet</p>
            )}
          </div>

          <div className="section-divider mb-8" />

          {/* Code Verification */}
          <div className="mb-8">
            <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-4">Code Verification</h2>
            <div className="bg-ritual-surface rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-3">
                Verify this agent&apos;s code matches the onchain hash. Upload the source file to compare.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const buffer = await file.arrayBuffer();
                    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
                    const hashHex = '0x' + Array.from(new Uint8Array(hashBuffer))
                      .map(b => b.toString(16).padStart(2, '0'))
                      .join('');
                    setLocalCodeHash(hashHex);
                  }}
                  className="block text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-ritual-green/40 file:bg-ritual-green/10 file:text-ritual-green file:text-xs file:font-medium file:cursor-pointer"
                />
                <button
                  onClick={handleVerify}
                  disabled={!localCodeHash || verifying}
                  className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verifying...' : 'Verify Hash'}
                </button>
              </div>
              {codeVerified !== null && (
                <p
                  role="status"
                  className={`mt-3 text-sm font-medium font-mono ${codeVerified ? 'text-ritual-green' : 'text-red-400'}`}
                >
                  {codeVerified ? '✓ Code hash matches onchain record' : '✗ MISMATCH — code has been modified!'}
                </p>
              )}
            </div>
          </div>

          {/* Endpoint & Metadata */}
          <div className="space-y-4">
            {agent.endpoint && (
              <div>
                <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Endpoint</h2>
                <code className="block bg-ritual-surface p-3 rounded-xl font-mono text-sm break-all text-ritual-lime">
                  {agent.endpoint}
                </code>
              </div>
            )}
            {agent.codeHash && (
              <div>
                <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Onchain Code Hash</h2>
                <code className="block bg-ritual-surface p-3 rounded-xl font-mono text-sm break-all text-gray-400">
                  {agent.codeHash}
                </code>
              </div>
            )}
            {agent.metadataURI && (
              <div>
                <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Metadata URI</h2>
                <a
                  href={agent.metadataURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-ritual-surface p-3 rounded-xl font-mono text-sm break-all text-ritual-lime hover:text-ritual-green transition-colors"
                >
                  {agent.metadataURI}
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
