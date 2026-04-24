"use client";

import Link from 'next/link';
import type { Agent } from '../lib/types';

interface Props {
  agent: Agent;
}

export default function AgentCard({ agent }: Props) {
  return (
    <Link href={`/agent/${agent.address}`}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-ritual-accent/50 hover:shadow-[0_0_20px_rgba(200,255,0,0.3)] transition-all cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{agent.name}</h3>
            <p className="text-gray-500 text-sm font-mono">
              {agent.address.slice(0, 6)}...{agent.address.slice(-4)}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs ${agent.active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {agent.active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {agent.capabilities.slice(0, 3).join(' • ')}
          {agent.capabilities.length > 3 && ` • +${agent.capabilities.length - 3} more`}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{new Date(agent.registeredAt * 1000).toLocaleDateString()}</span>
          <span className="text-[#C8FF00]">View →</span>
        </div>
      </div>
    </Link>
  );
}
