import { Horizon, Networks } from "@stellar/stellar-sdk";
import {
  STELLAR_NETWORK,
  HORIZON_NETWORK_PASSPHRASE,
  HORIZON_URL,
  SOROBAN_RPC_URL,
  STELLAR_FRIENDBOT_URL,
} from "../utils/constants";

export class StellarService {
  private server: Horizon.Server;
  private network: string;
  private horizonUrl: string;
  private networkPassphrase: string;
  private friendBotUrl: string;
  private sorobanRpcUrl: string;

  constructor() {
    this.network = (STELLAR_NETWORK as string) || "testnet";
    this.horizonUrl = (HORIZON_URL as string) || this.getDefaultHorizonUrl();
    this.friendBotUrl =
      (STELLAR_FRIENDBOT_URL as string) || this.getDefaultFriendBotUrl();
    this.networkPassphrase =
      (HORIZON_NETWORK_PASSPHRASE as string) ||
      this.getDefaultNetworkPassphrase();
    this.sorobanRpcUrl = (SOROBAN_RPC_URL as string) || "";

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
}
