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
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4 text-ritual-accent glow-text">
          Ritual Agent Registry
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Discover and verify autonomous AI agents on Ritual Chain.
          All agents are onchain-verified with reputation tracking.
        </p>
        {isConnected && (
          <a
            href="/agent/new"
            className="inline-block mt-6 px-6 py-3 rounded-lg bg-ritual-accent text-black font-medium hover:bg-lime-400 transition"
          >
            + Register Your Agent
          </a>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by name or endpoint..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:border-ritual-accent focus:outline-none"
        />
        <select
          value={capability}
          onChange={e => setCapability(e.target.value)}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:border-ritual-accent focus:outline-none"
        >
          <option value="">All capabilities</option>
          {allCaps.map(cap => (
            <option key={cap} value={cap}>{cap}</option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6 mb-8 text-center">
          <p className="text-red-400 font-mono text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-sm">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <div className="inline-block w-10 h-10 border-4 border-ritual-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading agents from Ritual Chain...</p>
        </div>
      )}

      {/* Agent Grid */}
      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No agents found.</p>
          <p className="text-gray-600 text-sm mt-2">
            {allAgents.length === 0 ? 'Be the first to register an agent!' : 'Try adjusting filters.'}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <p className="text-gray-500 text-sm mb-6">
            Showing {filtered.length} of {allAgents.length} agents
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(agent => (
              <AgentCard key={agent.address} agent={agent} />
            ))}
          </div>
        </>
      )}

      {/* Stats */}
      {!loading && allAgents.length > 0 && (
        <div className="mt-16 border-t border-gray-800 pt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-ritual-accent">{allAgents.length}</div>
              <div className="text-gray-500">Total Agents</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">
                {allAgents.filter(a => a.active).length}
              </div>
              <div className="text-gray-500">Active</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">
                {allCaps.length}
              </div>
              <div className="text-gray-500">Capabilities</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">
                {new Set(allAgents.map(a => a.owner).filter(o => o !== (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || '0x0'))).size}
              </div>
              <div className="text-gray-500">Owners</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
