import { Icon } from "@stellar/design-system";
import { useState, useEffect } from "react";
import { IRentACarContract } from "../interfaces/contract";
import { stellarService } from "../services/stellar.service";
import Modal from "./Modal";

interface DiscoverCarsFormProps {
  walletAddress: string;
  onDiscoverCars: (ownerAddresses: string[]) => Promise<void>;
  onCancel: () => void;
}

export const DiscoverCarsForm = ({
  walletAddress,
  onDiscoverCars,
  onCancel,
}: DiscoverCarsFormProps) => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isFetchingFromContract, setIsFetchingFromContract] = useState(false);
  const [manualAddresses, setManualAddresses] = useState<string>("");
  const [discoveredAddresses, setDiscoveredAddresses] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  // Fetch all car owners from contract
  const fetchAllCarOwners = async () => {
    if (!walletAddress) return;

    setIsFetchingFromContract(true);
    setError("");
    try {
      const contractClient =
        await stellarService.buildClient<IRentACarContract>(walletAddress);
      
      const ownersResponse = await contractClient.get_all_car_owners();
      // Handle response - could be array directly or wrapped in result
      const owners = (ownersResponse as any)?.result || ownersResponse || [];
      
      if (Array.isArray(owners) && owners.length > 0) {
        // Convert addresses to strings if needed
        const addressStrings = owners.map((addr: any) => {
          if (typeof addr === 'string') return addr;
          // Handle different address formats
          return String(addr);
        });
        setDiscoveredAddresses(addressStrings);
      } else {
        setDiscoveredAddresses([]);
        setError("No cars found in the contract. Cars need to be added first.");
      }
    } catch (error: any) {
      console.error("Error fetching car owners:", error);
      const errorMsg = error?.message || String(error);
      setError(`Failed to fetch cars from contract: ${errorMsg}`);
    } finally {
      setIsFetchingFromContract(false);
    }
  };

  useEffect(() => {
    // Auto-fetch when component mounts
    void fetchAllCarOwners();
  }, [walletAddress]);

  const handleManualAdd = () => {
    const addresses = manualAddresses
      .split("\n")
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0 && addr.startsWith("G"));
    
    if (addresses.length === 0) {
      setError("Please enter at least one valid Stellar address (starting with 'G')");
      return;
    }

    // Merge with discovered addresses, avoiding duplicates
    const merged = [...new Set([...discoveredAddresses, ...addresses])];
    setDiscoveredAddresses(merged);
    setManualAddresses("");
    setError("");
  };

  const handleRemoveAddress = (address: string) => {
    setDiscoveredAddresses(prev => prev.filter(addr => addr !== address));
  };

  const handleDiscover = async () => {
    if (discoveredAddresses.length === 0) {
      setError("Please add at least one owner address to discover cars");
      return;
    }

    setIsDiscovering(true);
    setError("");
    try {
      await onDiscoverCars(discoveredAddresses);
      onCancel();
    } catch (error: any) {
      console.error("Error discovering cars:", error);
      setError(error?.message || "Failed to discover cars");
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <Modal title="Discover All Cars" closeModal={onCancel}>
      <div className="space-y-6">
        {/* Auto-fetch from contract */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon.Car01 className="w-5 h-5 text-[#00D4FF]" />
              <h3 className="text-lg font-semibold text-white">Fetch from Contract</h3>
            </div>
            <button
              type="button"
              onClick={() => void fetchAllCarOwners()}
              disabled={isFetchingFromContract}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isFetchingFromContract ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Icon.ArrowUp className="w-4 h-4" />
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-white/70">
            Automatically discover all cars registered in the contract by fetching owner addresses.
          </p>
        </div>

        {/* Manual address input */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Icon.User01 className="w-5 h-5 text-[#00D4FF]" />
            <span>Add Owner Addresses Manually</span>
          </h3>
          <div className="space-y-3">
            <textarea
              value={manualAddresses}
              onChange={(e) => setManualAddresses(e.target.value)}
              placeholder="Enter owner addresses (one per line)&#10;GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&#10;GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent transition-all duration-200 font-mono text-sm"
            />
            <button
              type="button"
              onClick={handleManualAdd}
              disabled={!manualAddresses.trim()}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Addresses
            </button>
          </div>
        </div>

        {/* Discovered addresses list */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Icon.CheckCircle className="w-5 h-5 text-green-400" />
            <span>Owner Addresses ({discoveredAddresses.length})</span>
          </h3>
          {discoveredAddresses.length === 0 ? (
            <p className="text-white/50 text-sm py-4 text-center">
              No addresses added yet. Use "Fetch from Contract" or add manually above.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {discoveredAddresses.map((address, index) => (
                <div
                  key={`${address}-${index}`}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <code className="text-sm text-white/80 font-mono flex-1 break-all">
                    {address}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddress(address)}
                    className="ml-3 p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                    title="Remove address"
                  >
                    <Icon.Trash01 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDiscover}
            disabled={isDiscovering || discoveredAddresses.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#00B8E6] hover:from-[#00B8E6] hover:to-[#0099CC] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            {isDiscovering ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Discovering...</span>
              </>
            ) : (
              <>
                <Icon.Car01 className="w-5 h-5" />
                <span>Discover Cars</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
