"use client";

import { Agent } from '../lib/types';
import Link from 'next/link';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  // Format timestamp
  const registeredDate = new Date(agent.registeredAt * 1000).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  // Truncate address for display
  const shortAddress = `${agent.address.slice(0, 6)}...${agent.address.slice(-4)}`;

  // Determine reputation status
  const isActive = agent.active;

  return (
    <div className="group card p-6 hover:shadow-glow-green transition-all duration-300 relative">
      {/* Left accent border */}
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-ritual-green via-ritual-pink to-ritual-gold opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* Header: Name + Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-display font-bold text-gray-300 truncate group-hover:text-ritual-green transition-colors">
            {agent.name}
          </h3>
          <p className="text-xs font-mono address mt-1">{shortAddress}</p>
        </div>

        {/* Active status badge */}
        {isActive ? (
          <span className="badge badge-green flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ritual-green animate-pulse-green" />
            Active
          </span>
        ) : (
          <span className="badge badge-red">Inactive</span>
        )}
      </div>

      {/* Endpoint */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Endpoint</p>
        <a
          href={agent.endpoint}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ritual-lime hover:underline font-mono break-all block"
        >
          {agent.endpoint}
        </a>
      </div>

      {/* Capabilities */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Capabilities</p>
        <div className="flex flex-wrap gap-2">
          {agent.capabilities.map((cap) => (
            <span
              key={cap}
              className="px-2.5 py-1 rounded-md bg-ritual-pink/10 border border-ritual-pink/20 text-ritual-pink text-xs font-medium"
            >
              {cap}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: Owner + Date */}
      <div className="pt-4 border-t border-gray-800 flex items-center justify-between text-xs">
        <div>
          <span className="text-ritual-green uppercase tracking-wider text-[10px]">Owner</span>
          <span className="font-mono ml-2 text-ritual-lime">
            {agent.owner.slice(0, 8)}...{agent.owner.slice(-6)}
          </span>
        </div>
        <span className="text-gray-500">{registeredDate}</span>
      </div>

      {/* Hover overlay with View link */}
      <div className="absolute inset-0 border border-ritual-green/0 rounded-xl transition-all duration-200 group-hover:border-ritual-green/30 pointer-events-none" />
    </div>
  );
}
