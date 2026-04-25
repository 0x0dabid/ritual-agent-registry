"use client";

import { PropsWithChildren } from 'react';
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect } from 'wagmi/connectors';

// Ritual chain configuration based on env vars
const chainId = parseInt(process.env.NEXT_PUBLIC_RITUAL_CHAIN_ID || '11022', 10);
const rpcUrl = process.env.NEXT_PUBLIC_RITUAL_RPC_URL || 'https://devnet.ritual.network';

const ritualChain = {
  id: chainId,
  name: 'Ritual Devnet',
  nativeCurrency: { name: 'xRIT', symbol: 'xRIT', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: { default: { name: 'Explorer', url: '' } },
} as const;

const config = createConfig({
  chains: [ritualChain],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
      metadata: {
        name: 'Ritual Agent Registry',
        description: 'Register and discover AI agents on Ritual Chain',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: ['https://ritual.network/favicon.ico'],
      },
    }),
  ],
  transports: {
    [chainId]: http(rpcUrl),
  },
  ssr: false,
});

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
