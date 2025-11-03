import { Icon } from "@stellar/design-system";
import { useEffect, useState } from "react";
import { AdminCommissionCard } from "../components/AdminCommissionCard";
import { CarsList } from "../components/CarList";
import { CreateCarForm } from "../components/CreateCarForm";
import { DiscoverCarsForm } from "../components/DiscoverCarsForm";
import Modal from "../components/Modal";
import StellarExpertLink from "../components/StellarExpertLink";
import useModal from "../hooks/useModal";
import { ICar } from "../interfaces/car";
import { CarStatus } from "../interfaces/car-status";
import { IRentACarContract } from "../interfaces/contract";
import { CreateCar } from "../interfaces/create-car";
import { UserRole } from "../interfaces/user-role";
import { useStellarAccounts } from "../providers/StellarAccountProviders";
import { stellarService } from "../services/stellar.service";
import { walletService } from "../services/wallet.service";
import { ONE_XLM_IN_STROOPS } from "../utils/xlm-in-stroops";

// Helper to get/set owner addresses in localStorage
const getStoredOwnerAddresses = (): string[] => {
  const stored = localStorage.getItem("carOwnerAddresses");
  return stored ? JSON.parse(stored) : [];
};

const addOwnerAddress = (address: string) => {
  const addresses = getStoredOwnerAddresses();
  if (!addresses.includes(address)) {
    addresses.push(address);
    localStorage.setItem("carOwnerAddresses", JSON.stringify(addresses));
  }
};

export default function Dashboard() {
  const { hashId, cars, walletAddress, setCars, setHashId, selectedRole } =
    useStellarAccounts();
  const { showModal, openModal, closeModal } = useModal();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncAddresses, setSyncAddresses] = useState<string>("");

  // Sync cars from contract using owner addresses - always refreshes from contract
  const syncCarsFromContract = async (ownerAddressesToUse?: string[]) => {
    if (!walletAddress || isSyncing) return;

    setIsSyncing(true);
    try {
      // Use provided addresses or get from storage
      const ownerAddresses = ownerAddressesToUse || getStoredOwnerAddresses();
      if (ownerAddresses.length === 0) {
        setShowSyncModal(true);
        setIsSyncing(false);
        return;
      }

      const contractClient =
        await stellarService.buildClient<IRentACarContract>(walletAddress);

      const carPromises = ownerAddresses.map(async (ownerAddress) => {
        try {
          // First check if car exists
          const hasCarResponse = await contractClient.has_car({ owner: ownerAddress });
          const hasCar = (hasCarResponse as any)?.result ?? hasCarResponse ?? false;
          if (!hasCar) {
            console.log(`Car not found for owner ${ownerAddress}`);
            return null;
          }

          // Wrap get_car in try-catch as it may still panic
          let carDataResponse;
          try {
            carDataResponse = await contractClient.get_car({ owner: ownerAddress });
          } catch (getCarError: any) {
            const errorMsg = getCarError?.message || String(getCarError);
            if (errorMsg.includes("UnreachableCodeReached") || 
                errorMsg.includes("Car not found") ||
                errorMsg.includes("not found")) {
              console.log(`Car ${ownerAddress} not found (get_car panic)`);
              return null;
            }
            throw getCarError; // Re-throw if it's a different error
          }
          const carData = (carDataResponse as any).result || carDataResponse;
          
          // Get car status directly from contract
          const statusResponse = await contractClient.get_car_status({ owner: ownerAddress });
          const statusRaw = (statusResponse as any).result ?? statusResponse;
          
          // Extract all car data from contract
          const brand = carData.brand ?? "Unknown";
          const model = carData.model ?? "Vehicle";
          const color = carData.color ?? "N/A";
          const passengersRaw = carData.passengers ?? 4;
          const passengers = typeof passengersRaw === 'bigint' ? Number(passengersRaw) : Number(passengersRaw);
          const ac = carData.ac ?? false;
          
          const pricePerDayRaw = carData.price_per_day ?? carData.pricePerDay;
          const pricePerDayInStroops = typeof pricePerDayRaw === 'bigint' 
            ? Number(pricePerDayRaw) 
            : Number(pricePerDayRaw);
          const pricePerDay = pricePerDayInStroops / ONE_XLM_IN_STROOPS;

          // Parse status correctly - handle both string and numeric values
          let status = CarStatus.AVAILABLE;
          if (typeof statusRaw === 'string') {
            status = statusRaw === "Rented" ? CarStatus.RENTED : CarStatus.AVAILABLE;
          } else if (typeof statusRaw === 'number') {
            status = statusRaw === 1 ? CarStatus.RENTED : CarStatus.AVAILABLE;
          } else if (statusRaw?.name === "Rented" || statusRaw?.value === 1) {
            status = CarStatus.RENTED;
          }
          
          return {
            brand: String(brand),
            model: String(model),
            color: String(color),
            passengers,
            pricePerDay,
            ac: Boolean(ac),
            ownerAddress,
            status, // Always use fresh status from contract
          } as ICar;
        } catch (error: any) {
          // Check if it's a "not found" error, panic error, or actual error
          const errorMsg = error?.message || String(error);
          if (errorMsg.includes("UnreachableCodeReached") ||
              errorMsg.includes("not found") || 
              errorMsg.includes("Car not found") ||
              errorMsg.includes("VM call trapped")) {
            console.log(`Car not found for owner ${ownerAddress} (expected)`);
          } else {
            console.error(`Error fetching car for ${ownerAddress}:`, error);
          }
          return null;
        }
      });

      const fetchedCars = (await Promise.all(carPromises)).filter(
        (car): car is ICar => car !== null
      );

      // Always update cars list, even if empty (to clear stale data)
      setCars(fetchedCars);
      
      // Save owner addresses for future syncs
      ownerAddresses.forEach(addr => addOwnerAddress(addr));
      
      if (fetchedCars.length > 0) {
        setShowSyncModal(false);
        setSyncAddresses("");
        console.log(`Successfully synced ${fetchedCars.length} car(s) from contract`);
      } else if (ownerAddressesToUse && ownerAddressesToUse.length > 0) {
        // Only show alert if user manually triggered sync with addresses
        alert("No cars found for the provided owner addresses.");
      } else {
        console.log("No cars found for stored owner addresses");
      }
    } catch (error) {
      console.error("Error syncing cars from contract:", error);
      alert("Error syncing cars. Please check the owner addresses and try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFromInput = () => {
    const addresses = syncAddresses
      .split("\n")
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0 && addr.startsWith("G"));
    
    if (addresses.length === 0) {
      alert("Please enter at least one valid Stellar address (starting with 'G')");
      return;
    }
    
    void syncCarsFromContract(addresses);
  };

  // Auto-sync when wallet connects - always refresh from contract
  useEffect(() => {
    if (!walletAddress || isSyncing) return;

    const autoSync = async () => {
      const ownerAddresses = getStoredOwnerAddresses();
      
      // Always try to sync from contract if we have stored addresses
      // This ensures we get fresh data from the contract, not from localStorage
      if (ownerAddresses.length > 0) {
        await syncCarsFromContract();
        return;
      }

      // If no stored addresses, try to check if the connected wallet has a car
      // (in case the user is a car owner)
      try {
        const contractClient =
          await stellarService.buildClient<IRentACarContract>(walletAddress);
        
        // Check if car exists before trying to fetch
        try {
          const hasCarResponse = await contractClient.has_car({ owner: walletAddress });
          const hasCar = (hasCarResponse as any)?.result ?? hasCarResponse ?? false;
          if (!hasCar) {
            console.log("Connected wallet doesn't have a car registered");
            return;
          }

          // Wrap get_car in try-catch as it may still panic
          let carDataResponse;
          try {
            carDataResponse = await contractClient.get_car({ owner: walletAddress });
          } catch (getCarError: any) {
            const errorMsg = getCarError?.message || String(getCarError);
            if (errorMsg.includes("UnreachableCodeReached") || 
                errorMsg.includes("Car not found") ||
                errorMsg.includes("not found")) {
              console.log("Connected wallet doesn't have a car registered (get_car panic)");
              return;
            }
            throw getCarError; // Re-throw if it's a different error
          }
          const carData = (carDataResponse as any).result || carDataResponse;
          
          // Get status from contract
          const statusResponse = await contractClient.get_car_status({ owner: walletAddress });
          const statusRaw = (statusResponse as any).result ?? statusResponse;
          
          // Extract all car data from contract
          const brand = carData.brand ?? "My Vehicle";
          const model = carData.model ?? "Car";
          const color = carData.color ?? "N/A";
          const passengersRaw = carData.passengers ?? 4;
          const passengers = typeof passengersRaw === 'bigint' ? Number(passengersRaw) : Number(passengersRaw);
          const ac = carData.ac ?? false;
          
          const pricePerDayRaw = carData.price_per_day ?? carData.pricePerDay;
          const pricePerDayInStroops = typeof pricePerDayRaw === 'bigint' 
            ? Number(pricePerDayRaw) 
            : Number(pricePerDayRaw);
          const pricePerDay = pricePerDayInStroops / ONE_XLM_IN_STROOPS;

          // Parse status
          let status = CarStatus.AVAILABLE;
          if (typeof statusRaw === 'string') {
            status = statusRaw === "Rented" ? CarStatus.RENTED : CarStatus.AVAILABLE;
          } else if (typeof statusRaw === 'number') {
            status = statusRaw === 1 ? CarStatus.RENTED : CarStatus.AVAILABLE;
          } else if (statusRaw?.name === "Rented" || statusRaw?.value === 1) {
            status = CarStatus.RENTED;
          }

          // If found, add the car and save the owner address
          const foundCar: ICar = {
            brand: String(brand),
            model: String(model),
            color: String(color),
            passengers,
            pricePerDay,
            ac: Boolean(ac),
            ownerAddress: walletAddress,
            status,
          };

          setCars([foundCar]);
          addOwnerAddress(walletAddress);
        } catch (error: any) {
          // Connected wallet doesn't have a car or error occurred
          const errorMsg = error?.message || String(error);
          if (errorMsg.includes("UnreachableCodeReached") ||
              errorMsg.includes("not found") || 
              errorMsg.includes("Car not found") ||
              errorMsg.includes("VM call trapped")) {
            console.log("Connected wallet doesn't have a car registered");
          } else {
            console.error("Error checking wallet for car:", error);
          }
        }
      } catch (error) {
        console.error("Error checking wallet for cars:", error);
      }
    };

    // Always auto-sync when wallet connects to get fresh data from contract
    void autoSync();
    
    // For renters, if no cars are found after auto-sync, show the discover modal
    // This runs after a delay to let autoSync complete
    const checkRenterDiscovery = setTimeout(() => {
      const storedAddresses = getStoredOwnerAddresses();
      if (selectedRole === UserRole.RENTER && cars.length === 0 && storedAddresses.length === 0) {
        setShowSyncModal(true);
      }
    }, 2000);
    
    return () => clearTimeout(checkRenterDiscovery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, selectedRole]); // Trigger when walletAddress or role changes

  const handleCreateCar = async (formData: CreateCar) => {
    const { brand, model, color, passengers, pricePerDay, ac, ownerAddress, commissionPercentage } =
      formData;
    const contractClient =
      await stellarService.buildClient<IRentACarContract>(walletAddress);

    // Convert percentage to basis points (5% = 500, 5.5% = 550)
    const commissionBasisPoints = Math.round(commissionPercentage * 100);

    const addCarResult = await contractClient.add_car({
      owner: ownerAddress,
      brand,
      model,
      color,
      passengers,
      ac,
      price_per_day: pricePerDay * ONE_XLM_IN_STROOPS,
      commission_percentage: commissionBasisPoints,
    });
    const xdr = addCarResult.toXDR();

    const signedTx = await walletService.signTransaction(xdr);
    const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

    // Store owner address for future sync
    addOwnerAddress(ownerAddress);

    const newCar: ICar = {
      brand,
      model,
      color,
      passengers,
      pricePerDay,
      ac,
      ownerAddress,
      status: CarStatus.AVAILABLE,
    };

    setCars((prevCars) => [...prevCars, newCar]);
    setHashId(txHash as string);
    closeModal();
  };

  // Calculate stats
  const totalCars = cars.length;
  const availableCars = cars.filter((car) => car.status === CarStatus.AVAILABLE).length;
  const rentedCars = cars.filter((car) => car.status === CarStatus.RENTED).length;
  const totalRevenue = cars.reduce((sum, car) => sum + car.pricePerDay, 0);

  const StatCard = ({
    icon,
    label,
    value,
    gradient,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    gradient: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className={`text-3xl font-extrabold ${gradient}`}>{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
              Premium <span className="text-gradient">Fleet</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Browse and manage our collection of premium vehicles
            </p>
          </div>

          <div className="flex items-center gap-3">
            {walletAddress && (
              <>
                <button
                  type="button"
                  onClick={() => void syncCarsFromContract()}
                  disabled={isSyncing}
                  className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title="Refresh cars from contract"
                >
                  {isSyncing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <Icon.ArrowUp className="w-5 h-5" />
                      <span>Refresh</span>
                    </>
                  )}
                </button>
                {selectedRole === UserRole.RENTER && (
                  <button
                    type="button"
                    onClick={() => setShowSyncModal(true)}
                    className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    title="Discover cars by entering owner addresses"
                  >
                    <Icon.Car01 className="w-5 h-5" />
                    <span>Discover Cars</span>
                  </button>
                )}
              </>
            )}
            {selectedRole === UserRole.ADMIN && (
              <button
                type="button"
                onClick={openModal}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#00B8E6] hover:from-[#00B8E6] hover:to-[#0099CC] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="text-xl font-bold">+</span>
                <span>Add Vehicle</span>
              </button>
            )}
          </div>
        </div>

        {/* Admin Commission Card - Only visible to admins */}
        {selectedRole === UserRole.ADMIN && walletAddress && (
          <div className="max-w-md mx-auto sm:mx-0">
            <AdminCommissionCard
              walletAddress={walletAddress}
              onWithdrawSuccess={(txHash) => setHashId(txHash)}
            />
          </div>
        )}

        {/* Stats Overview */}
        {totalCars > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<Icon.Car01 className="w-6 h-6 text-gray-700" />}
              label="Total Fleet"
              value={totalCars}
              gradient="text-gray-900"
            />
            <StatCard
              icon={<Icon.CheckCircle className="w-6 h-6 text-green-600" />}
              label="Available"
              value={availableCars}
              gradient="text-green-600"
            />
            <StatCard
              icon={<Icon.Clock className="w-6 h-6 text-blue-600" />}
              label="Rented"
              value={rentedCars}
              gradient="text-blue-600"
            />
            <StatCard
              icon={<Icon.Wallet02 className="w-6 h-6 text-[#F4A261]" />}
              label="Avg. Price/Day"
              value={
                totalCars > 0
                  ? `$${Math.round(totalRevenue / totalCars)}`
                  : "$0"
              }
              gradient="text-[#F4A261]"
            />
          </div>
        )}

        {/* Cars Grid */}
        <div>
          {cars && cars.length > 0 ? (
            <CarsList cars={cars} />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Icon.Car01 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Vehicles Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {selectedRole === UserRole.ADMIN
                  ? "Get started by adding your first vehicle to the fleet."
                  : selectedRole === UserRole.RENTER
                  ? "Discover available cars by entering owner addresses. Click 'Discover Cars' to get started!"
                  : "There are no vehicles available at the moment. Check back soon!"}
              </p>
              {selectedRole === UserRole.ADMIN && (
                <button
                  type="button"
                  onClick={openModal}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#00B8E6] hover:from-[#00B8E6] hover:to-[#0099CC] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="text-xl font-bold">+</span>
                  <span>Add Your First Vehicle</span>
                </button>
              )}
              {selectedRole === UserRole.RENTER && walletAddress && (
                <button
                  type="button"
                  onClick={() => setShowSyncModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Icon.Car01 className="w-5 h-5" />
                  <span>Discover Available Cars</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {showModal && (
          <CreateCarForm onCreateCar={handleCreateCar} onCancel={closeModal} />
        )}

        {/* Discover Cars Modal - New component for renters */}
        {showSyncModal && selectedRole === UserRole.RENTER && walletAddress && (
          <DiscoverCarsForm
            walletAddress={walletAddress}
            onDiscoverCars={async (ownerAddresses: string[]) => {
              await syncCarsFromContract(ownerAddresses);
            }}
            onCancel={() => setShowSyncModal(false)}
          />
        )}

        {/* Sync Modal - Legacy for non-renters */}
        {showSyncModal && selectedRole !== UserRole.RENTER && (
          <Modal title="Sync Cars from Contract" closeModal={() => setShowSyncModal(false)}>
            <div className="space-y-4">
              <p className="text-white/80 text-sm mb-4">
                Enter the owner addresses (one per line) to sync cars from the contract. Addresses must start with 'G'.
              </p>
              
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  Owner Addresses
                </label>
                <textarea
                  value={syncAddresses}
                  onChange={(e) => setSyncAddresses(e.target.value)}
                  placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&#10;GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&#10;..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent transition-all duration-200 font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowSyncModal(false);
                    setSyncAddresses("");
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSyncFromInput}
                  disabled={isSyncing || !syncAddresses.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Icon.ArrowUp className="w-5 h-5" />
                      <span>Sync Cars</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {hashId && <StellarExpertLink url={hashId} />}
      </div>
    </div>
  );
}
