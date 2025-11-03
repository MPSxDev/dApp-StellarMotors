import { Icon } from "@stellar/design-system";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStellarAccounts } from "../providers/StellarAccountProviders";
import { walletService } from "../services/wallet.service";

export default function ConnectWallet() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { setWalletAddress } = useStellarAccounts();
  const navigate = useNavigate();

  const handleConnectWallet = async () => {
    setIsConnecting(true);

    try {
      const address = await walletService.connect();
      localStorage.setItem("wallet", address);

      setWalletAddress(address);
      void navigate("/role-selection");
    } catch (error) {
      console.error(error);
      setIsConnecting(false);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#1a2744] to-[#0A1628]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(244,162,97,0.1),transparent_50%)]" />
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#00D4FF] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#F4A261] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Content */}
      <div className="relative z-10 text-center space-y-12 max-w-2xl px-4 sm:px-6 lg:px-8 animate-fade-in">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00D4FF] to-[#00B8E6] shadow-2xl shadow-[#00D4FF]/40 mb-4">
              <Icon.Car01 className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight">
            Stellar <span className="text-gradient">Motors</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 max-w-xl mx-auto leading-relaxed">
            Premium car rentals powered by blockchain. Connect your wallet to access the decentralized marketplace.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <Icon.CheckCircle className="w-5 h-5 text-[#00D4FF]" />
            <span>Secure & Decentralized</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon.Check className="w-5 h-5 text-[#10B981]" />
            <span>Transparent Transactions</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon.Wallet02 className="w-5 h-5 text-[#F4A261]" />
            <span>Powered by Stellar</span>
          </div>
        </div>

        {/* Connect Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => void handleConnectWallet()}
            disabled={isConnecting}
            className="group relative px-8 py-4 bg-gradient-to-r from-[#00D4FF] to-[#00B8E6] text-white font-bold text-lg rounded-2xl shadow-xl shadow-[#00D4FF]/30 hover:shadow-2xl hover:shadow-[#00D4FF]/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="flex items-center gap-3">
              {isConnecting ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Icon.Wallet02 className="w-6 h-6" />
                  <span>Connect Wallet</span>
                </>
              )}
            </div>
            
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00D4FF] to-[#00B8E6] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10" />
          </button>
        </div>

        {/* Additional Info */}
        <p className="text-sm text-white/50 max-w-md mx-auto">
          By connecting, you agree to our terms of service and privacy policy. Your wallet will only be used for transactions on the Stellar network.
        </p>
      </div>
    </div>
  );
}
