import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Home from './Home';
import Academy from './Academy';
import Chapter1 from './Chapter1';
import { WalletProvider } from './WalletContext';

// Import RainbowKit, Wagmi, and TanStack Query
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import { AnimatePresence } from 'framer-motion';

// Initialize React Query
const queryClient = new QueryClient();

// Configure Wagmi with RainbowKit
const config = getDefaultConfig({
  appName: 'TRUC Academy',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '044601f652123328db4060db1379b2a4', // Fallback testing project ID
  chains: [mainnet, polygon, optimism, arbitrum, base],
});

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/academy" element={<Navigate to="/" replace />} />
        <Route path="/chapter-1" element={<Chapter1 />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#00ffcc',
            accentColorForeground: '#000000',
            borderRadius: 'small',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          <WalletProvider>
            <Router>
              <div className="app-container">
                <AnimatedRoutes />
              </div>
            </Router>
          </WalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
