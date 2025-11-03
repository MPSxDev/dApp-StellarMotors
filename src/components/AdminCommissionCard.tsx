import { Icon } from "@stellar/design-system";
import { useEffect, useState } from "react";
import { IRentACarContract } from "../interfaces/contract";
import { stellarService } from "../services/stellar.service";
import { walletService } from "../services/wallet.service";
import { ONE_XLM_IN_STROOPS } from "../utils/xlm-in-stroops";

interface AdminCommissionCardProps {
  walletAddress: string;
  onWithdrawSuccess?: (txHash: string) => void;
}

export const AdminCommissionCard = ({
  walletAddress,
  onWithdrawSuccess,
}: AdminCommissionCardProps) => {
  const [commissionBalance, setCommissionBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch commission balance
  useEffect(() => {
    const fetchCommissionBalance = async () => {
      if (!walletAddress) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const contractClient =
          await stellarService.buildClient<IRentACarContract>(walletAddress);
        
        const balanceResponse = await contractClient.get_admin_commission_balance();
        // Handle both direct number and wrapped response
        const balanceRaw = (balanceResponse as any).result ?? balanceResponse;
        const balanceInStroops = typeof balanceRaw === 'bigint' 
          ? Number(balanceRaw) 
          : Number(balanceRaw);
        
        const balanceInXlm = balanceInStroops / ONE_XLM_IN_STROOPS;
        setCommissionBalance(balanceInXlm);
      } catch (err) {
        console.error("Error fetching commission balance:", err);
        setError("Failed to load commission balance");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCommissionBalance();
    
    // Refresh balance periodically
    const interval = setInterval(fetchCommissionBalance, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [walletAddress]);

  const handleWithdraw = async () => {
    if (commissionBalance <= 0) {
      setError("No commissions available to withdraw");
      return;
    }

    if (!confirm(`Are you sure you want to withdraw ${commissionBalance.toFixed(7)} XLM in commissions?`)) {
      return;
    }

    setIsWithdrawing(true);
    setError(null);

    try {
      const contractClient =
        await stellarService.buildClient<IRentACarContract>(walletAddress);

      const result = await contractClient.withdraw_admin_commissions();
      const xdr = result.toXDR();

      const signedTx = await walletService.signTransaction(xdr);
      const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

      if (txHash && onWithdrawSuccess) {
        onWithdrawSuccess(txHash);
      }

      // Refresh balance after withdrawal
      setCommissionBalance(0);
      
      // Show success message
      alert(`Successfully withdrawn ${commissionBalance.toFixed(7)} XLM!`);
    } catch (err) {
      console.error("Error withdrawing commissions:", err);
      setError("Failed to withdraw commissions. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100">
            <Icon.Wallet02 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Admin Commissions</h3>
            <p className="text-sm text-gray-600">Accumulated platform fees</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-purple-900">
                  {commissionBalance.toFixed(7)}
                </span>
                <span className="text-lg font-semibold text-purple-700">XLM</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleWithdraw}
              disabled={isWithdrawing || commissionBalance <= 0}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isWithdrawing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Withdrawing...</span>
                </>
              ) : (
                <>
                  <Icon.ArrowUp className="w-5 h-5" />
                  <span>Withdraw All Commissions</span>
                </>
              )}
            </button>

            {commissionBalance <= 0 && (
              <p className="text-center text-sm text-gray-500">
                No commissions available to withdraw
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
