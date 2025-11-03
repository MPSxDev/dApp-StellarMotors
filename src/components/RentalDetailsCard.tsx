import { Icon } from "@stellar/design-system";
import { ICar } from "../interfaces/car";

interface Rental {
  totalDaysToRent: number;
  amount: number;
  startTime: number;
  endTime: number;
}

interface RentalDetailsCardProps {
  car: ICar;
  rental: Rental;
  onEndRental: () => Promise<void>;
}

export const RentalDetailsCard = ({
  car,
  rental,
  onEndRental,
}: RentalDetailsCardProps) => {
  const now = Math.floor(Date.now() / 1000);
  const daysRemaining = Math.max(0, Math.ceil((rental.endTime - now) / 86400));
  const isExpired = rental.endTime < now;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEndRental = async () => {
    if (confirm("Are you sure you want to return this vehicle?")) {
      await onEndRental();
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 p-6 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-1">
            Active Rental
          </h3>
          <p className="text-sm text-gray-600">
            {car.brand} {car.model}
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
          <span className="flex items-center gap-1">
            <Icon.Clock className="w-3 h-3" />
            RENTED
          </span>
        </div>
      </div>

      {/* Rental Details */}
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white/60">
            <p className="text-xs text-gray-600 mb-1">Start Date</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(rental.startTime)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/60">
            <p className="text-xs text-gray-600 mb-1">End Date</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(rental.endTime)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white/60">
            <p className="text-xs text-gray-600 mb-1">Duration</p>
            <p className="text-sm font-semibold text-gray-900">
              {rental.totalDaysToRent} {rental.totalDaysToRent === 1 ? "day" : "days"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/60">
            <p className="text-xs text-gray-600 mb-1">Amount Paid</p>
            <p className="text-sm font-semibold text-[#00D4FF]">
              ${rental.amount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Days Remaining */}
      <div className="mb-6 p-4 rounded-lg bg-white/80 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 mb-1">
              {isExpired ? "Rental Period" : "Time Remaining"}
            </p>
            <p className={`text-2xl font-extrabold ${isExpired ? "text-orange-600" : "text-blue-600"}`}>
              {isExpired ? "Expired" : `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}`}
            </p>
          </div>
          <Icon.Clock className="w-8 h-8 text-blue-400" />
        </div>
      </div>

      {/* Return Button */}
      <button
        type="button"
        onClick={handleEndRental}
        className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
      >
        <Icon.CheckCircle className="w-5 h-5" />
        <span>Return Vehicle</span>
      </button>
    </div>
  );
};
