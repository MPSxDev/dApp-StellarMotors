import {
  AlbedoModule,
  FREIGHTER_ID,
  FreighterModule,
  type ISupportedWallet,
  StellarWalletsKit,
  WalletNetwork,
  xBullModule,
} from "@creit.tech/stellar-wallets-kit";
import { STELLAR_NETWORK } from "../utils/constants";
import { stellarService, StellarService } from "./stellar.service";

export class WalletService {
  private readonly kit: StellarWalletsKit;
  private readonly stellarService: StellarService;

  constructor(stellarService: StellarService) {
    this.stellarService = stellarService;
    const networkName = (STELLAR_NETWORK as string)?.toLowerCase() || "testnet";
    const walletNetwork =
      networkName === "mainnet" || networkName === "public"
        ? WalletNetwork.PUBLIC
        : WalletNetwork.TESTNET;
    this.kit = new StellarWalletsKit({
      network: walletNetwork,
      selectedWalletId: FREIGHTER_ID,
      modules: [new xBullModule(), new FreighterModule(), new AlbedoModule()],
    });
  }

  async connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      void this.kit.openModal({
        onWalletSelected: (option: ISupportedWallet) => {
          this.kit.setWallet(option.id);
          this.kit
            .getAddress()
            .then(({ address }) => resolve(address))
            .catch((error) =>
              reject(error instanceof Error ? error : new Error(String(error))),
            );
        },
      });
    });
  }

  async disconnect(): Promise<void> {
    await this.kit.disconnect();
  }

  async signTransaction(xdr: string): Promise<{
    signedTxXdr: string;
    signedAddress?: string;
  }> {
    const environment = this.stellarService.environment();
    return await this.kit.signTransaction(xdr, {
      networkPassphrase: environment.networkPassphrase,
    });
  }
}

export const walletService = new WalletService(stellarService);
