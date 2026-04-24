import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { ritualChain } from '../lib/ritual';

// Note: Ritual wallet connector might be custom. For now, use MetaMask-style.
// Update when @ritual-net/wallet-kit is published.
export const config = createConfig({
  chains: [ritualChain],
  transports: {
    [ritualChain.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
