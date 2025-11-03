import { Icon } from "@stellar/design-system";
import { useEffect, useState } from "react";
import { ICar } from "../interfaces/car";
import { IRentACarContract } from "../interfaces/contract";
import { stellarService } from "../services/stellar.service";
import Modal from "./Modal";

interface RentalModalProps {
  car: ICar;
  onConfirm: (days: number) => Promise<void>;
  onCancel: () => void;
  walletAddress: string;
}

export const RentalModal = ({
  car,
  onConfirm,
  onCancel,
  walletAddress,
}: RentalModalProps) => {
  const [days, setDays] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commissionPercentage, setCommissionPercentage] = useState<number>(0);

  // Fetch commission percentage from contract
  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const contractClient =
          await stellarService.buildClient<IRentACarContract>(walletAddress);
        const carDataResponse = await contractClient.get_car({ owner: car.ownerAddress });
        // The data is in the 'result' property of the response
        const carData = (carDataResponse as any).result || carDataResponse;
        console.log("RentalModal - Car data from contract:", carData);
        
        // Contract returns BigInt values - convert to numbers
        const commissionPercentageRaw = carData.commission_percentage ?? carData.commissionPercentage ?? 0;
        const percentage = typeof commissionPercentageRaw === 'bigint'
          ? Number(commissionPercentageRaw)
          : Number(commissionPercentageRaw);
        console.log("RentalModal - Commission percentage:", percentage);
        setCommissionPercentage(percentage);
      } catch (error) {
        console.error("Error fetching commission:", error);
        setCommissionPercentage(0);
      }
    };
    void fetchCommission();
  }, [car.ownerAddress, walletAddress]);

  const baseAmount = car.pricePerDay * days;
  // Calculate commission: (baseAmount * commissionPercentage) / 10000
  const commissionAmount = (baseAmount * commissionPercentage) / 10000;
  const totalAmount = baseAmount + commissionAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await onConfirm(days);
    } catch (error) {
      console.error("Error processing rental:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal title="Rent Vehicle" closeModal={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Car Info */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Icon.Car01 className="w-6 h-6 text-[#00D4FF]" />
            <h3 className="text-xl font-bold text-white">
              {car.brand} {car.model}
            </h3>
          </div>
          <p className="text-white/70 text-sm">{car.color} • {car.passengers} seats</p>
        </div>

        {/* Days Selector */}
        <div>
          <label className="block text-sm font-semibold text-white/90 mb-3">
            Rental Period (Days)
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setDays(Math.max(1, days - 1))}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              disabled={days <= 1}
            >
              <span className="text-2xl font-bold">−</span>
            </button>
            <input
              type="number"
              min="1"
              max="365"
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
              className="w-24 px-4 py-3 text-center text-2xl font-bold text-white bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            />
            <button
              type="button"
              onClick={() => setDays(Math.min(365, days + 1))}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              disabled={days >= 365}
            >
              <span className="text-2xl font-bold">+</span>
            </button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex justify-between text-white/80">
            <span>Price per day</span>
            <span className="font-medium">{car.pricePerDay.toFixed(4)} XLM</span>
          </div>
          {commissionPercentage > 0 && (
            <div className="flex justify-between text-white/70 text-sm">
              <span className="flex items-center gap-1">
                <Icon.Wallet02 className="w-3 h-3" />
                Commission per day
              </span>
              <span className="font-medium">{(car.pricePerDay * commissionPercentage / 10000).toFixed(4)} XLM ({(commissionPercentage / 100).toFixed(1)}%)</span>
            </div>
          )}
          <div className="flex justify-between text-white/80">
            <span>Days</span>
            <span className="font-medium">{days}</span>
          </div>
          <div className="flex justify-between text-white/90 font-semibold border-t border-white/10 pt-2">
            <span>Subtotal</span>
            <span>{baseAmount.toFixed(4)} XLM</span>
          </div>
          {commissionAmount > 0 && (
            <div className="flex justify-between text-white/70 text-sm">
              <span>Total commission ({days} days × {(commissionPercentage / 100).toFixed(1)}%)</span>
              <span>{commissionAmount.toFixed(4)} XLM</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-extrabold text-[#00D4FF] border-t border-white/20 pt-2">
            <span>Total</span>
            <span>{totalAmount.toFixed(4)} XLM</span>
          </div>
        </div>

        {/* Action Buttons */}
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
            disabled={isProcessing}
            className="px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#00B8E6] hover:from-[#00B8E6] hover:to-[#0099CC] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Icon.Car01 className="w-5 h-5" />
                <span>Confirm Rental</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
