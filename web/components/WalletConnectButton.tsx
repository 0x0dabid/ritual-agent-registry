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
        className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-mono transition"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  // Use first available connector (Injected = browser wallet like MetaMask)
  const injected = connectors.find((c) => c.id === 'injected');

  return (
    <button
      onClick={() => {
        if (injected) {
          connect({ connector: injected });
        } else {
          // Fallback: connect with first available
          connect({ connector: connectors[0] });
        }
      }}
      className="px-4 py-2 rounded-lg bg-ritual-accent text-black font-medium hover:bg-lime-400 transition"
      disabled={connectors.length === 0}
    >
      {connectors.length === 0 ? 'No Wallet' : 'Connect Wallet'}
    </button>
  );
}
