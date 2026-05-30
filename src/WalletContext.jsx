import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);

  // Perform Supabase whitelist validation when address/connection state changes
  useEffect(() => {
    const validateWallet = async () => {
      if (!address || !isConnected) {
        setIsWhitelisted(false);
        setIsValidating(false);
        return;
      }

      setIsValidating(true);
      setError(null);

      try {
        // Query allowed_wallets table in Supabase
        const { data, error: dbError } = await supabase
          .from('allowed_wallets')
          .select('wallet_address')
          .ilike('wallet_address', address)
          .maybeSingle();

        if (dbError) {
          console.error("Database error during whitelist validation:", dbError);
          // Handle cases where the allowed_wallets table doesn't exist yet gracefully
          if (dbError.code === 'PGRST204' || dbError.message.includes('does not exist')) {
            setError("Database table 'allowed_wallets' not found. Please run the SQL setup script in your Supabase dashboard.");
          } else {
            setError(`Database error: ${dbError.message}`);
          }
          setIsWhitelisted(false);
        } else if (data) {
          setIsWhitelisted(true);
        } else {
          setIsWhitelisted(false);
          setError("Wallet address not registered on the Supabase whitelist.");
        }
      } catch (err) {
        console.error("Connection error during whitelist validation:", err);
        setError("Failed to verify wallet due to database connection error.");
        setIsWhitelisted(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateWallet();
  }, [address, isConnected]);

  const connectWallet = async () => {
    setError(null);
    try {
      if (openConnectModal) {
        openConnectModal();
      } else {
        setError("Wallet connection modal is not available. Please try again.");
      }
    } catch (err) {
      console.error("Error launching connect modal:", err);
      setError("Failed to connect wallet. Please try again.");
    }
  };

  const disconnectWallet = () => {
    setError(null);
    disconnect();
  };

  return (
    <WalletContext.Provider value={{
      walletAddress: address ? address.toLowerCase() : null,
      isConnected,
      isWhitelisted,
      isValidating,
      error,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
};
