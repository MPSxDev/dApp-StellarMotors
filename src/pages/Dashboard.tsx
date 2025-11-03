import { Icon } from "@stellar/design-system";
import { useEffect, useState } from "react";
import { AdminCommissionCard } from "../components/AdminCommissionCard";
import { CarsList } from "../components/CarList";
import { CreateCarForm } from "../components/CreateCarForm";
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

  // Sync cars from contract using owner addresses
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
          const carDataResponse = await contractClient.get_car({ owner: ownerAddress });
          const carData = (carDataResponse as any).result || carDataResponse;
          
          const pricePerDayRaw = carData.price_per_day ?? carData.pricePerDay;
          const pricePerDayInStroops = typeof pricePerDayRaw === 'bigint' 
            ? Number(pricePerDayRaw) 
            : Number(pricePerDayRaw);
          const pricePerDay = pricePerDayInStroops / ONE_XLM_IN_STROOPS;

          const statusRaw = carData.car_status ?? carData.carStatus;
          const status = statusRaw === "Rented" || statusRaw === 1 
            ? CarStatus.RENTED 
            : CarStatus.AVAILABLE;

          // Create car with minimal info from contract
          // Note: brand, model, color, passengers, ac are not in contract, so we use placeholders
          return {
            brand: "Unknown",
            model: "Vehicle",
            color: "N/A",
            passengers: 4,
            pricePerDay,
            ac: false,
            ownerAddress,
            status,
          } as ICar;
        } catch (error) {
          console.error(`Error fetching car for ${ownerAddress}:`, error);
          return null;
        }
      });

      const fetchedCars = (await Promise.all(carPromises)).filter(
        (car): car is ICar => car !== null
      );

      if (fetchedCars.length > 0) {
        setCars(fetchedCars);
        // Save owner addresses for future syncs
        ownerAddresses.forEach(addr => addOwnerAddress(addr));
        setShowSyncModal(false);
        setSyncAddresses("");
      } else {
        alert("No cars found for the provided owner addresses.");
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

  // Auto-sync when wallet connects or cars array is empty
  useEffect(() => {
    if (!walletAddress || isSyncing) return;

    const autoSync = async () => {
      const ownerAddresses = getStoredOwnerAddresses();
      
      // If we have stored owner addresses, try to sync
      if (ownerAddresses.length > 0) {
        await syncCarsFromContract();
        return;
      }

      // If no stored addresses, try to check if the connected wallet has a car
      // (in case the user is a car owner)
      try {
        const contractClient =
          await stellarService.buildClient<IRentACarContract>(walletAddress);
        
        // Try to get car for the connected wallet address
        try {
          const carDataResponse = await contractClient.get_car({ owner: walletAddress });
          const carData = (carDataResponse as any).result || carDataResponse;
          
          const pricePerDayRaw = carData.price_per_day ?? carData.pricePerDay;
          const pricePerDayInStroops = typeof pricePerDayRaw === 'bigint' 
            ? Number(pricePerDayRaw) 
            : Number(pricePerDayRaw);
          const pricePerDay = pricePerDayInStroops / ONE_XLM_IN_STROOPS;

          const statusRaw = carData.car_status ?? carData.carStatus;
          const status = statusRaw === "Rented" || statusRaw === 1 
            ? CarStatus.RENTED 
            : CarStatus.AVAILABLE;

          // If found, add the car and save the owner address
          const foundCar: ICar = {
            brand: "My Vehicle",
            model: "Car",
            color: "N/A",
            passengers: 4,
            pricePerDay,
            ac: false,
            ownerAddress: walletAddress,
            status,
          };

          setCars([foundCar]);
          addOwnerAddress(walletAddress);
        } catch (error) {
          // Connected wallet doesn't have a car, that's okay
          console.log("Connected wallet doesn't have a car registered");
        }
      } catch (error) {
        console.error("Error checking wallet for cars:", error);
      }
    };

    // Auto-sync when wallet is connected and we have no cars
    if (cars.length === 0) {
      void autoSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]); // Trigger when walletAddress changes (wallet connects)

  const handleCreateCar = async (formData: CreateCar) => {
    const { brand, model, color, passengers, pricePerDay, ac, ownerAddress, commissionPercentage } =
      formData;
    const contractClient =
      await stellarService.buildClient<IRentACarContract>(walletAddress);

    // Convert percentage to basis points (5% = 500, 5.5% = 550)
    const commissionBasisPoints = Math.round(commissionPercentage * 100);

    const addCarResult = await contractClient.add_car({
      owner: ownerAddress,
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
            {cars.length === 0 && walletAddress && (
              <button
                type="button"
                onClick={syncCarsFromContract}
                disabled={isSyncing}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSyncing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Icon.ArrowUp className="w-5 h-5" />
                    <span>Sync from Contract</span>
                  </>
                )}
              </button>
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
            </div>
          )}
        </div>

        {/* Modals */}
        {showModal && (
          <CreateCarForm onCreateCar={handleCreateCar} onCancel={closeModal} />
        )}

        {/* Sync Modal */}
        {showSyncModal && (
          <Modal title="Sync Cars from Contract" closeModal={() => setShowSyncModal(false)}>
            <div className="space-y-4">
              <p className="text-white/80 text-sm mb-4">
                Enter the owner addresses (one per line) to sync cars from the contract. 
                Addresses must start with 'G'.
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
