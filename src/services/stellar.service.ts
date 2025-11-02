import {
  Horizon,
  Networks,
  TransactionBuilder,
  contract,
} from "@stellar/stellar-sdk";
import {
  STELLAR_NETWORK,
  HORIZON_NETWORK_PASSPHRASE,
  HORIZON_URL,
  SOROBAN_RPC_URL,
  STELLAR_FRIENDBOT_URL,
  CONTRACT_ADDRESS,
} from "../utils/constants";

export class StellarService {
  private server: Horizon.Server;
  private network: string;
  private horizonUrl: string;
  private networkPassphrase: string;
  private friendBotUrl: string;
  private sorobanRpcUrl: string;
  private contractAddress: string;

  constructor() {
    this.network = (STELLAR_NETWORK as string) || "testnet";
    this.horizonUrl = (HORIZON_URL as string) || this.getDefaultHorizonUrl();
    this.friendBotUrl =
      (STELLAR_FRIENDBOT_URL as string) || this.getDefaultFriendBotUrl();
    this.networkPassphrase =
      (HORIZON_NETWORK_PASSPHRASE as string) ||
      this.getDefaultNetworkPassphrase();
    this.sorobanRpcUrl = (SOROBAN_RPC_URL as string) || "";
    this.contractAddress = (CONTRACT_ADDRESS as string) || "";

    this.server = new Horizon.Server(this.horizonUrl, {
      allowHttp: this.isLocalNetwork(),
    });
  }

  /**
   * Get the Horizon server instance
   */
  public getServer(): Horizon.Server {
    return this.server;
  }

  /**
   * Get the current network name
   */
  public getNetwork(): string {
    return this.network;
  }

  /**
   * Get the Horizon URL
   */
  public getHorizonUrl(): string {
    return this.horizonUrl;
  }

  /**
   * Get the network passphrase
   */
  public getNetworkPassphrase(): string {
    return this.networkPassphrase;
  }

  /**
   * Get the FriendBot URL
   */
  public getFriendBotUrl(): string {
    return this.friendBotUrl;
  }

  /**
   * Get the Soroban RPC URL
   */
  public getSorobanRpcUrl(): string {
    return this.sorobanRpcUrl;
  }

  /**
   * Get default Horizon URL based on network
   */
  private getDefaultHorizonUrl(): string {
    switch (this.network.toLowerCase()) {
      case "mainnet":
      case "public":
        return "https://horizon.stellar.org";
      case "testnet":
        return "https://horizon-testnet.stellar.org";
      case "local":
      case "standalone":
      default:
        return "http://localhost:8000";
    }
  }

  /**
   * Get default FriendBot URL based on network
   */
  private getDefaultFriendBotUrl(): string {
    switch (this.network.toLowerCase()) {
      case "testnet":
        return "https://friendbot.stellar.org";
      case "local":
      case "standalone":
        return "http://localhost:8000/friendbot";
      case "mainnet":
      case "public":
      default:
        return "";
    }
  }

  /**
   * Get default network passphrase based on network
   */
  private getDefaultNetworkPassphrase(): string {
    switch (this.network.toLowerCase()) {
      case "mainnet":
      case "public":
        return Networks.PUBLIC;
      case "testnet":
        return Networks.TESTNET;
      case "local":
      case "standalone":
      default:
        return "Standalone Network ; February 2017";
    }
  }

  /**
   * Check if using local network
   */
  private isLocalNetwork(): boolean {
    return (
      this.network.toLowerCase() === "local" ||
      this.network.toLowerCase() === "standalone" ||
      this.horizonUrl.startsWith("http://")
    );
  }

  /**
   * Build a contract client for interacting with smart contracts
   */
  async buildClient<T = unknown>(publicKey: string): Promise<T> {
    const client = await contract.Client.from({
      contractId: this.contractAddress,
      rpcUrl: this.sorobanRpcUrl,
      networkPassphrase: this.networkPassphrase,
      publicKey,
    });

    return client as T;
  }

  /**
   * Submit a transaction to the network
   */
  async submitTransaction(xdr: string): Promise<string | undefined> {
    try {
      const transaction = TransactionBuilder.fromXDR(
        xdr,
        this.networkPassphrase,
      );
      const result = await this.server.submitTransaction(transaction);

      return result.hash;
    } catch (error) {
      console.error(error);
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        const errorData = error.response.data as {
          extras?: { result_codes?: unknown };
        };
        if (errorData.extras?.result_codes) {
          console.error(
            "❌ Error en la transacción:",
            errorData.extras.result_codes,
          );
        } else {
          console.error("❌ Error general:", error);
        }
      } else {
        console.error("❌ Error general:", error);
      }
    }
  }

  /**
   * Get environment configuration for wallet kit
   */
  environment(): { rpc: string; networkPassphrase: string } {
    return {
      rpc: this.sorobanRpcUrl,
      networkPassphrase: this.networkPassphrase,
    };
  }
}

export const stellarService = new StellarService();
