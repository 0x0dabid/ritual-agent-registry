"use client";

import { PropsWithChildren } from 'react';
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      selectedAddress?: string;
    };
  }
}

const chainId = parseInt(process.env.NEXT_PUBLIC_RITUAL_CHAIN_ID || '11022', 10);
const rpcUrl = process.env.NEXT_PUBLIC_RITUAL_RPC_URL || 'https://devnet.ritual.network';

// Ritual Devnet (placeholder chain config)
const ritualDevnet = {
  id: chainId,
  name: 'Ritual Devnet',
  nativeCurrency: { name: 'xRIT', symbol: 'xRIT', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: { default: { name: 'Explorer', url: '' } },
} as const;

const config = createConfig({
  chains: [ritualDevnet],
  transports: {
    [chainId]: http(rpcUrl),
  },
  ssr: false, // use client-side only
});

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

// Helper to get wallet client from window.ethereum
export function getWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  // @ts-ignore
  return window.ethereum.request({ method: 'eth_requestAccounts' })
    .then(() => ({
      account: (window as any).ethereum.selectedAddress,
      chainId,
      transport: http(rpcUrl),
    }));
}
