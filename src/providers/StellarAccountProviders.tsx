import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { IAccount } from "../interfaces/account";
import {
  getAccountFromStorage,
  getCurrentAccountFromStorage,
  saveCurrentAccount,
} from "../utils/local-storage";
import { UserRole } from "../interfaces/user-role";
import { ICar } from "../interfaces/car";

interface StellarContextType {
  currentAccount: string;
  hashId: string;
  setHashId: React.Dispatch<React.SetStateAction<string>>;
  walletAddress: string;
  setWalletAddress: (address: string) => void;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole | null) => void;
  setCurrentAccount: (name: string) => void;
  getAccount: (name: string) => IAccount | null;
  getCurrentAccountData: () => IAccount | null;
  cars: ICar[];
  setCars: React.Dispatch<React.SetStateAction<ICar[]>>;
}

const StellarAccountContext = createContext<StellarContextType | undefined>(
  undefined,
);

// eslint-disable-next-line react-refresh/only-export-components
export const useStellarAccounts = () => {
  const context = use(StellarAccountContext);
  if (context === undefined) {
    throw new Error(
      "useStellarAccounts must be used within a StellarAccountProvider",
    );
  }
  return context;
};

export const StellarAccountProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string>(() => {
    return localStorage.getItem("wallet") || "";
  });

  const [currentAccount, setCurrentAccountState] = useState<string>(() =>
    getCurrentAccountFromStorage(),
  );

  const [hashId, setHashId] = useState<string>("");

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem("role");
    return saved ? (saved as UserRole) : null;
  });

  const [cars, setCars] = useState<ICar[]>(() => {
    const savedCars = localStorage.getItem("cars");
    const parsedCars = savedCars ? (JSON.parse(savedCars) as ICar[]) : [];
    
    // Populate owner addresses when cars are loaded
    if (parsedCars.length > 0) {
      const ownerAddresses = parsedCars.map(car => car.ownerAddress);
      localStorage.setItem("carOwnerAddresses", JSON.stringify(ownerAddresses));
    }
    
    return parsedCars;
  });

  const setCurrentAccount = useCallback((name: string) => {
    setCurrentAccountState(name);
    saveCurrentAccount(name);
  }, []);

  const getAccount = useCallback((name: string): IAccount | null => {
    return getAccountFromStorage(name);
  }, []);

  const getCurrentAccountData = useCallback((): IAccount | null => {
    if (!currentAccount) return null;
    return getAccountFromStorage(currentAccount);
  }, [currentAccount]);

  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem("wallet", walletAddress);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (selectedRole) {
      localStorage.setItem("role", selectedRole);
    }
  }, [selectedRole]);

  useEffect(() => {
    localStorage.setItem("cars", JSON.stringify(cars));
  }, [cars]);

  const value: StellarContextType = useMemo(
    () => ({
      walletAddress,
      currentAccount,
      hashId,
      setHashId,
      setWalletAddress,
      setCurrentAccount,
      getAccount,
      selectedRole,
      setSelectedRole,
      getCurrentAccountData,
      cars,
      setCars,
    }),
    [
      walletAddress,
      currentAccount,
      hashId,
      setWalletAddress,
      setCurrentAccount,
      getAccount,
      selectedRole,
      getCurrentAccountData,
      cars,
      setHashId,
      setSelectedRole,
      setCars,
    ],
  );

  return (
    <StellarAccountContext value={value}>{children}</StellarAccountContext>
  );
};
