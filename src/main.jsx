import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import Wagmi dan OnchainKit
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { baseSepolia } from 'viem/chains';
import { config } from './wagmi.config';

// Setup React Query
const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={baseSepolia}
          apiKey={'04221134-6b20-40a2-a3a4-2ebe5da44d49'}
          paymasterServiceUrl={'https://api.developer.coinbase.com/rpc/v1/base-sepolia/EK3aBnJG12L01rU3pAcOpmLTTJ8Wr9v9'}
        >
          <App />
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);