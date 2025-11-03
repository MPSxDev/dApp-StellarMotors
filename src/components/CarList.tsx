import { Icon } from "@stellar/design-system";
import { useEffect, useState } from "react";
import { ICar } from "../interfaces/car";
import { CarStatus } from "../interfaces/car-status";
import { IRentACarContract } from "../interfaces/contract";
import { UserRole } from "../interfaces/user-role";
import { useStellarAccounts } from "../providers/StellarAccountProviders";
import { RentalModal } from "./RentalModal";
import { stellarService } from "../services/stellar.service";
import { walletService } from "../services/wallet.service";
import { shortenAddress } from "../utils/shorten-address";
import { ONE_XLM_IN_STROOPS } from "../utils/xlm-in-stroops";

interface CarsListProps {
  cars: ICar[];
}

export const CarsList = ({ cars }: CarsListProps) => {
  const { walletAddress, selectedRole, setHashId, setCars } =
    useStellarAccounts();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedCarForRental, setSelectedCarForRental] = useState<ICar | null>(null);
  const [carCommissions, setCarCommissions] = useState<Record<string, number>>({}); // Commission per day in XLM
  const [availableToWithdraw, setAvailableToWithdraw] = useState<Record<string, number>>({}); // Available to withdraw per car in stroops

  // Fetch commission data, status, and available to withdraw from contract for all cars
  // Also updates car status to ensure it's always fresh from the contract
  useEffect(() => {
    const fetchCarData = async () => {
      if (!walletAddress || cars.length === 0) return;

      try {
        const contractClient =
          await stellarService.buildClient<IRentACarContract>(walletAddress);
        
        const dataPromises = cars.map(async (car) => {
          try {
            // Check if car still exists in contract
            const hasCarResponse = await contractClient.has_car({ owner: car.ownerAddress });
            const hasCar = (hasCarResponse as any)?.result ?? hasCarResponse ?? false;
            if (!hasCar) {
              console.log(`Car ${car.ownerAddress} no longer exists in contract`);
              return null;
            }

            // Wrap get_car in try-catch as it may still panic
            let carDataResponse;
            try {
              carDataResponse = await contractClient.get_car({ owner: car.ownerAddress });
            } catch (getCarError: any) {
              const errorMsg = getCarError?.message || String(getCarError);
              if (errorMsg.includes("UnreachableCodeReached") || 
                  errorMsg.includes("Car not found") ||
                  errorMsg.includes("not found")) {
                console.log(`Car ${car.ownerAddress} not found (get_car panic)`);
                return null;
              }
              throw getCarError; // Re-throw if it's a different error
            }
            // The data is in the 'result' property of the response
            const carData = (carDataResponse as any).result || carDataResponse;
            
            // Get fresh status from contract
            const statusResponse = await contractClient.get_car_status({ owner: car.ownerAddress });
            const statusRaw = (statusResponse as any).result ?? statusResponse;
            
            // Parse status correctly
            let currentStatus = CarStatus.AVAILABLE;
            if (typeof statusRaw === 'string') {
              currentStatus = statusRaw === "Rented" ? CarStatus.RENTED : CarStatus.AVAILABLE;
            } else if (typeof statusRaw === 'number') {
              currentStatus = statusRaw === 1 ? CarStatus.RENTED : CarStatus.AVAILABLE;
            } else if (statusRaw?.name === "Rented" || statusRaw?.value === 1) {
              currentStatus = CarStatus.RENTED;
            }
            
            // Update car status if it changed
            if (car.status !== currentStatus) {
              setCars((prevCars) =>
                prevCars.map((c) =>
                  c.ownerAddress === car.ownerAddress
                    ? { ...c, status: currentStatus }
                    : c
                )
              );
            }
            
            // Contract returns BigInt values - convert to numbers
            const pricePerDayRaw = carData.price_per_day ?? carData.pricePerDay;
            const commissionPercentageRaw = carData.commission_percentage ?? carData.commissionPercentage ?? 0;
            const availableToWithdrawRaw = carData.available_to_withdraw ?? 0;
            
            // Convert BigInt to number (BigInt values have 'n' suffix like 500n, 1000000000n)
            const pricePerDayInStroops = typeof pricePerDayRaw === 'bigint' 
              ? Number(pricePerDayRaw) 
              : Number(pricePerDayRaw);
            const commissionPercentage = typeof commissionPercentageRaw === 'bigint'
              ? Number(commissionPercentageRaw)
              : Number(commissionPercentageRaw);
            const availableToWithdrawStroops = typeof availableToWithdrawRaw === 'bigint'
              ? Number(availableToWithdrawRaw)
              : Number(availableToWithdrawRaw);
            
            // Calculate commission per day: (price_per_day * commission_percentage) / 10000
            const pricePerDay = pricePerDayInStroops / ONE_XLM_IN_STROOPS;
            const commissionPerDay = (pricePerDay * commissionPercentage) / 10000;
            
            return { 
              owner: car.ownerAddress, 
              commission: commissionPerDay,
              availableToWithdraw: availableToWithdrawStroops,
              status: currentStatus
            };
          } catch (error: any) {
            const errorMsg = error?.message || String(error);
            if (errorMsg.includes("UnreachableCodeReached") ||
                errorMsg.includes("not found") || 
                errorMsg.includes("Car not found") ||
                errorMsg.includes("VM call trapped")) {
              console.log(`Car ${car.ownerAddress} not found in contract (may have been removed)`);
              return null; // Car was removed from contract
            }
            console.error(`Error fetching data for car ${car.ownerAddress}:`, error);
            return { owner: car.ownerAddress, commission: 0, availableToWithdraw: 0, status: car.status };
          }
        });

        const results = (await Promise.all(dataPromises)).filter((r): r is NonNullable<typeof r> => r !== null);
        
        // Remove cars that no longer exist in contract
        const existingOwners = new Set(results.map(r => r.owner));
        const removedCars = cars.filter(c => !existingOwners.has(c.ownerAddress));
        if (removedCars.length > 0) {
          setCars((prevCars) => prevCars.filter(c => existingOwners.has(c.ownerAddress)));
        }
        
        const commissionMap: Record<string, number> = {};
        const withdrawMap: Record<string, number> = {};
        results.forEach(({ owner, commission, availableToWithdraw }) => {
          commissionMap[owner] = commission;
          withdrawMap[owner] = availableToWithdraw;
        });
        
        setCarCommissions(commissionMap);
        setAvailableToWithdraw(withdrawMap);
      } catch (error) {
        console.error("Error fetching car data:", error);
      }
    };

    void fetchCarData();
    
    // Refresh car status every 30 seconds to keep it up to date
    const interval = setInterval(() => {
      void fetchCarData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [cars, walletAddress, setCars]);

  const handleDelete = async (owner: string) => {
    if (!confirm("Are you sure you want to remove this car?")) return;

    const contractClient =
      await stellarService.buildClient<IRentACarContract>(walletAddress);

    const result = await contractClient.remove_car({ owner });
    const xdr = result.toXDR();

    const signedTx = await walletService.signTransaction(xdr);
    const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

    setCars((prev) => prev.filter((car) => car.ownerAddress !== owner));
    setHashId(txHash as string);
  };

  const handlePayout = async (owner: string, amount: number) => {
    if (!confirm(`Are you sure you want to withdraw ${(amount / ONE_XLM_IN_STROOPS).toFixed(7)} XLM?`)) {
      return;
    }

    try {
      const contractClient =
        await stellarService.buildClient<IRentACarContract>(walletAddress);

      const result = await contractClient.payout_owner({ owner, amount });
      const xdr = result.toXDR();

      const signedTx = await walletService.signTransaction(xdr);
      const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

      setHashId(txHash as string);
      
      // Refresh available balance after withdrawal
      setAvailableToWithdraw(prev => ({
        ...prev,
        [owner]: 0
      }));
      
      alert(`Successfully withdrawn ${(amount / ONE_XLM_IN_STROOPS).toFixed(7)} XLM!`);
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      alert("Failed to withdraw funds. Please try again.");
    }
  };

  const handleRent = async (totalDaysToRent: number) => {
    if (!selectedCarForRental) return;

    const car = selectedCarForRental;
    const contractClient =
      await stellarService.buildClient<IRentACarContract>(walletAddress);

    const result = await contractClient.rental({
      renter: walletAddress,
      owner: car.ownerAddress,
      total_days_to_rent: totalDaysToRent,
      amount: car.pricePerDay * totalDaysToRent * ONE_XLM_IN_STROOPS,
    });
    const xdr = result.toXDR();

    const signedTx = await walletService.signTransaction(xdr);
    const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

    setCars((prev) =>
      prev.map((c) =>
        c.ownerAddress === car.ownerAddress
          ? { ...c, status: CarStatus.RENTED }
          : c,
      ),
    );
    setHashId(txHash as string);
    setSelectedCarForRental(null); // Close modal
  };

  const handleEndRental = async (owner: string) => {
    if (!confirm("Are you sure you want to return this vehicle?")) return;

    const contractClient =
      await stellarService.buildClient<IRentACarContract>(walletAddress);

    const result = await contractClient.end_rental({
      renter: walletAddress,
      owner: owner,
    });
    const xdr = result.toXDR();

    const signedTx = await walletService.signTransaction(xdr);
    const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

    setCars((prev) =>
      prev.map((c) =>
        c.ownerAddress === owner
          ? { ...c, status: CarStatus.AVAILABLE }
          : c,
      ),
    );
    setHashId(txHash as string);
  };

  const getStatusBadge = (status: CarStatus) => {
    const baseClasses = "badge";
    switch (status) {
      case CarStatus.AVAILABLE:
        return `${baseClasses} badge-available`;
      case CarStatus.RENTED:
        return `${baseClasses} badge-rented`;
      case CarStatus.MAINTENANCE:
        return `${baseClasses} badge-maintenance`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const getStatusIcon = (status: CarStatus) => {
    switch (status) {
      case CarStatus.AVAILABLE:
        return <Icon.CheckCircle className="w-4 h-4" />;
      case CarStatus.RENTED:
        return <Icon.Clock className="w-4 h-4" />;
      case CarStatus.MAINTENANCE:
        return <Icon.Tool01 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const renderActionButton = (car: ICar) => {
    if (selectedRole === UserRole.ADMIN) {
      return (
        <button
          type="button"
          onClick={() => void handleDelete(car.ownerAddress)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <Icon.Trash01 className="w-4 h-4" />
          <span>Remove</span>
        </button>
      );
    }

    if (selectedRole === UserRole.OWNER) {
      // Only show withdraw button if:
      // 1. Current user is the owner of this car
      // 2. Car is available (not rented)
      // 3. There are funds available to withdraw
      const isOwnerOfThisCar = walletAddress === car.ownerAddress;
      const hasAvailableFunds = (availableToWithdraw[car.ownerAddress] ?? 0) > 0;
      const isCarAvailable = car.status === CarStatus.AVAILABLE;
      
      if (!isOwnerOfThisCar || !hasAvailableFunds || !isCarAvailable) {
        return null;
      }
      
      const amount = availableToWithdraw[car.ownerAddress];
      return (
        <button
          type="button"
          onClick={() => void handlePayout(car.ownerAddress, amount)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <Icon.Wallet02 className="w-4 h-4" />
          <span>Withdraw</span>
        </button>
      );
    }

    if (selectedRole === UserRole.RENTER) {
      if (car.status === CarStatus.AVAILABLE) {
        return (
          <button
            type="button"
            onClick={() => setSelectedCarForRental(car)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#00B8E6] hover:from-[#00B8E6] hover:to-[#0099CC] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Icon.Car01 className="w-5 h-5" />
            <span>Rent Now</span>
          </button>
        );
      } else if (car.status === CarStatus.RENTED) {
        return (
          <button
            type="button"
            onClick={() => handleEndRental(car.ownerAddress)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Icon.CheckCircle className="w-5 h-5" />
            <span>Return Vehicle</span>
          </button>
        );
      }
    }

    return null;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  if (cars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <Icon.Car01 className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Cars Available</h3>
        <p className="text-gray-600 text-center max-w-md">
          There are no cars in the fleet yet. Check back soon or add a car if you're an admin.
        </p>
      </div>
    );
  }

  return (
    <div data-test="cars-list" className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {cars.map((car) => (
          <div
            key={car.ownerAddress}
            className="group relative bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
            onMouseEnter={() => setHoveredCard(car.ownerAddress)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Car Image Placeholder with Gradient */}
            <div className="relative h-48 bg-gradient-to-br from-[#00D4FF]/20 via-[#F4A261]/20 to-[#00D4FF]/20 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon.Car01 className="w-24 h-24 text-gray-300" />
              </div>
              
              {/* Status Badge - Top Right */}
              <div className="absolute top-4 right-4">
                <span className={getStatusBadge(car.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(car.status)}
                    {car.status}
                  </span>
                </span>
              </div>

              {/* Glass morphism overlay on hover */}
              {hoveredCard === car.ownerAddress && (
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm transition-all duration-300" />
              )}
            </div>

            {/* Card Content */}
            <div className="p-6 space-y-4">
              {/* Car Name & Price */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-1">
                    {car.brand} {car.model}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">{car.color}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#00D4FF]">
                    {car.pricePerDay.toFixed(4)} XLM
                  </div>
                  <div className="text-xs text-gray-500">per day</div>
                  {carCommissions[car.ownerAddress] !== undefined && carCommissions[car.ownerAddress] > 0 && (
                    <div className="mt-1 text-xs text-purple-600 font-medium flex items-center gap-1 justify-end">
                      <Icon.Wallet02 className="w-3 h-3" />
                      <span>+{carCommissions[car.ownerAddress].toFixed(4)} XLM commission/day</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                  <Icon.Users01 className="w-3 h-3" />
                  <span>{car.passengers} seats</span>
                </div>
                {car.ac && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full text-xs font-medium text-blue-700">
                    <Icon.CheckCircle className="w-3 h-3" />
                    <span>A/C</span>
                  </div>
                )}
              </div>

              {/* Owner Info */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Icon.User01 className="w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(car.ownerAddress)}
                    className="text-sm font-mono text-gray-600 hover:text-[#00D4FF] transition-colors"
                    title="Click to copy address"
                  >
                    {shortenAddress(car.ownerAddress)}
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {renderActionButton(car)}
              </div>
            </div>

            {/* Hover Glow Effect */}
            {hoveredCard === car.ownerAddress && (
              <div className="absolute inset-0 border-2 border-[#00D4FF]/30 rounded-2xl pointer-events-none transition-all duration-300" />
            )}
          </div>
        ))}
      </div>

      {/* Rental Modal */}
      {selectedCarForRental && (
        <RentalModal
          car={selectedCarForRental}
          walletAddress={walletAddress}
          onConfirm={handleRent}
          onCancel={() => setSelectedCarForRental(null)}
        />
      )}
    </div>
  );
};
