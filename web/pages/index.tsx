import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import AgentCard from '../components/AgentCard';
import { Agent } from '../lib/types';
import { getAllAgents, getAgentsByCapability } from '../lib/ritual';
import { useQuery } from '@tanstack/react-query';

export default function HomePage() {
  const { isConnected } = useAccount();
  const [search, setSearch] = useState('');
  const [capability, setCapability] = useState('');
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all agents from contract
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const agents = await getAllAgents();
        setAllAgents(agents);
      } catch (err: any) {
        console.error('Failed to fetch agents:', err);
        setError(err.message || 'Failed to load agents. Is the contract deployed?');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Extract unique capabilities for filter dropdown
  const allCaps = Array.from(new Set(allAgents.flatMap(a => a.capabilities))).sort();

  // Apply filters
  const filtered = allAgents.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                         (a.endpoint || '').toLowerCase().includes(search.toLowerCase());
    const matchesCap = capability ? a.capabilities.includes(capability) : true;
    return matchesSearch && matchesCap;
  });

  return (
    <div className="min-h-screen bg-ritual-black text-gray-300 font-body">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-mesh-gradient opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-ritual-green/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-noise opacity-30" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-ritual-green/20 bg-ritual-green/5 text-ritual-green text-xs font-mono uppercase tracking-wider mb-8 animate-float">
              <span className="w-2 h-2 rounded-full bg-ritual-green animate-pulse-green" />
              TEE-Verified Infrastructure
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-ritual-lime glow-text mb-6 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              Ritual Agent Registry
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Discover and verify autonomous AI agents on Ritual Chain.
              Every agent is{' '}
              <span className="text-ritual-green font-semibold">onchain-verified</span>{' '}
              with cryptographically signed code hashes.
            </p>

            {/* CTA + Connect */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="wallet-connect-wrapper">
                {/* ConnectButton from wagmi will render here */}
              </div>

              {isConnected && (
                <>
                  <a
                    href="/agent/new"
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-ritual-green text-ritual-green hover:bg-ritual-green/10 hover:shadow-glow-green transition-all duration-200 font-semibold"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Register Your Agent
                  </a>

                  <button
                    onClick={() => window.location.href = '/agent/new'}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-ritual-pink text-ritual-pink hover:bg-ritual-pink/10 hover:shadow-glow-pink transition-all text-sm"
                  >
                    Learn how it works
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Stats row */}
            {!loading && allAgents.length > 0 && (
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                <div className="bg-ritual-elevated/80 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
                  <div className="text-3xl font-bold text-ritual-lime font-mono">{allAgents.length}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Registered Agents</div>
                </div>
                <div className="bg-ritual-elevated/80 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
                  <div className="text-3xl font-bold text-ritual-green font-mono">{new Set(allAgents.map(a => a.owner)).size}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Owners</div>
                </div>
                <div className="bg-ritual-elevated/80 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
                  <div className="text-3xl font-bold text-ritual-pink font-mono">{allCaps.length}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Capabilities</div>
                </div>
                <div className="bg-ritual-elevated/80 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
                  <div className="text-3xl font-bold text-ritual-gold font-mono">1979</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Chain ID</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Filters */}
        <div className="mb-12 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ritual-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or endpoint..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-ritual-surface border border-gray-700 rounded-xl text-gray-300 placeholder-gray-500 focus:border-ritual-green focus:ring-2 focus:ring-ritual-green/20 focus:outline-none transition-all"
            />
          </div>
          <select
            value={capability}
            onChange={e => setCapability(e.target.value)}
            className="px-4 py-3 bg-ritual-surface border border-gray-700 rounded-xl text-gray-300 focus:border-ritual-pink focus:ring-2 focus:ring-ritual-pink/20 focus:outline-none cursor-pointer appearance-none"
          >
            <option value="">All capabilities</option>
            {allCaps.map(cap => (
              <option key={cap} value={cap} className="bg-ritual-elevated">{cap}</option>
            ))}
          </select>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-10 bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 text-red-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 rounded-lg text-red-300 text-sm font-medium transition-colors">
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-4">
              <div className="w-8 h-8 border-2 border-ritual-green border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-400 font-mono text-sm animate-pulse-green">Loading agents from Ritual Chain...</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && !error && (
          <div className="py-20 text-center">
            <div className="inline-block p-6 rounded-full bg-ritual-elevated border border-ritual-pink/30 mb-6">
              <svg className="w-12 h-12 text-ritual-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-display font-bold text-ritual-lime mb-2">No agents found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {allAgents.length === 0
                ? 'Be the first to register an autonomous agent on Ritual Chain.'
                : 'Try adjusting your search filters.'}
            </p>
            {!isConnected && allAgents.length === 0 && (
              <p className="text-ritual-green text-sm mt-4 font-mono">
                Connect your wallet to get started.
              </p>
            )}
          </div>
        )}

        {/* Agent grid */}
        {!loading && filtered.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-gray-400 font-mono text-sm">
                Showing <span className="text-ritual-lime font-semibold">{filtered.length}</span> of{' '}
                <span className="text-ritual-green font-semibold">{allAgents.length}</span> agents
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(agent => (
                <AgentCard key={agent.address} agent={agent} />
              ))}
            </div>
          </>
        )}

        {/* Footer CTA */}
        {!isConnected && allAgents.length === 0 && (
          <div className="mt-20 text-center">
            <div className="bg-ritual-elevated border border-ritual-pink/30 rounded-2xl p-8 max-w-2xl mx-auto shadow-card">
              <h2 className="text-2xl font-display font-bold text-ritual-lime mb-4">
                Ready to deploy your agent?
              </h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Connect your wallet to register an autonomous AI agent on the Ritual Chain registry.
                Your agent&apos;s code hash is stored on-chain for verification.
              </p>
              <div className="wallet-connect-wrapper" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
