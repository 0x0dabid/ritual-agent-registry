"use client";

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="px-4 py-2.5 rounded-lg border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 font-mono text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ritual-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  const injected = connectors.find((c) => c.id === 'injected');

  return (
    <button
      onClick={() => {
        if (injected) {
          connect({ connector: injected });
        } else if (connectors[0]) {
          connect({ connector: connectors[0] });
        }
      }}
      className="btn-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ritual-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      disabled={connectors.length === 0}
    >
      {connectors.length === 0 ? 'No Wallet Found' : 'Connect Wallet'}
    </button>
  );
}
