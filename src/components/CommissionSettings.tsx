import { Icon } from "@stellar/design-system";
import { useEffect, useState } from "react";
import { IRentACarContract } from "../interfaces/contract";
import Modal from "./Modal";
import { stellarService } from "../services/stellar.service";
import { walletService } from "../services/wallet.service";
import { ONE_XLM_IN_STROOPS } from "../utils/xlm-in-stroops";

interface CommissionSettingsProps {
  walletAddress: string;
  onCancel: () => void;
}

export const CommissionSettings = ({
  walletAddress,
  onCancel,
}: CommissionSettingsProps) => {
  const [currentCommission, setCurrentCommission] = useState<number | null>(
    null,
  );
  const [commission, setCommission] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommission = async () => {
      setIsLoading(true);
      try {
        const contractClient =
          await stellarService.buildClient<IRentACarContract>(walletAddress);
        const commissionInStroops = await contractClient.get_commission();
        const commissionInXlm = commissionInStroops / ONE_XLM_IN_STROOPS;
        setCurrentCommission(commissionInXlm);
        setCommission(commissionInXlm.toString());
      } catch (err) {
        console.error("Error fetching commission:", err);
        setError("Failed to load current commission rate");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCommission();
  }, [walletAddress]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const commissionInXlm = parseFloat(commission);
      
      if (isNaN(commissionInXlm) || commissionInXlm < 0) {
        setError("Commission must be a valid non-negative number");
        setIsSubmitting(false);
        return;
      }

      const commissionInStroops = Math.round(commissionInXlm * ONE_XLM_IN_STROOPS);

      const contractClient =
        await stellarService.buildClient<IRentACarContract>(walletAddress);

      const setCommissionResult = await contractClient.set_commission({
        commission: commissionInStroops,
      });
      const xdr = setCommissionResult.toXDR();

      const signedTx = await walletService.signTransaction(xdr);
      await stellarService.submitTransaction(signedTx.signedTxXdr);

      setCurrentCommission(commissionInXlm);
      // Close modal after successful submission
      setTimeout(() => {
        onCancel();
      }, 1000);
    } catch (err) {
      console.error("Error setting commission:", err);
      setError("Failed to update commission rate. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Commission Settings" closeModal={onCancel}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        {/* Current Commission Display */}
        {!isLoading && currentCommission !== null && (
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon.Wallet02 className="w-5 h-5 text-[#00D4FF]" />
                <span className="text-sm font-medium text-white/70">
                  Current Commission Rate
                </span>
              </div>
              <span className="text-xl font-bold text-white">
                {currentCommission.toFixed(4)} XLM
              </span>
            </div>
            <p className="text-xs text-white/50 mt-2">
              This is the flat commission amount charged per rental transaction
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Commission Input */}
        <div>
          <label
            htmlFor="commission"
            className="block text-sm font-semibold text-white/90 mb-2"
          >
            Commission Rate (XLM)
            <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
              <Icon.Wallet02 className="w-5 h-5" />
            </div>
            <input
              id="commission"
              name="commission"
              type="number"
              step="0.0001"
              min="0"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              placeholder="0.0000"
              required
              disabled={isLoading}
              className="w-full px-4 pl-11 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-white/50 mt-2">
            Enter the commission amount in XLM that will be charged per rental.
            This is a flat fee, not a percentage.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50">
            <div className="flex items-center gap-2">
              <Icon.AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#00B8E6] hover:from-[#00B8E6] hover:to-[#0099CC] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Icon.CheckCircle className="w-5 h-5" />
                <span>Update Commission</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
