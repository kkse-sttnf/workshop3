import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

// Konfigurasi Coinbase Smart Wallet dengan paymaster support
const coinbaseWalletConnector = coinbaseWallet({
  appName: 'Todolist with Blockchain',
  appLogoUrl: 'https://example.com/logo.png', // Ganti dengan logo app Anda
  darkMode: true,
  // Enable smart wallet features
  smartWalletOnly: true, // Hanya gunakan smart wallet, bukan extension
  enableSponsoredTransactions: true, // Enable sponsored transactions
})

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [coinbaseWalletConnector],
  transports: {
    [baseSepolia.id]: http(), // Akan menggunakan public RPC
  },
  // Paymaster configuration
  paymaster: {
    // URL paymaster service dari Coinbase
    url: 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/EK3aBnJG12L01rU3pAcOpmLTTJ8Wr9v9' || 'https://api.developer.coinbase.com/rpc/v1/base-sepolia',
    // API key untuk authentication
    apiKey: '04221134-6b20-40a2-a3a4-2ebe5da44d49',
  },
})