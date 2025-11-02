import { STELLAR_NETWORK } from "../utils/constants";

interface StellarExpertLinkProps {
  url: string;
}

export default function StellarExpertLink({ url }: StellarExpertLinkProps) {
  const network = (STELLAR_NETWORK as string) || "testnet";
  const explorerUrl =
    network === "mainnet" || network === "public"
      ? `https://stellar.expert/explorer/public/tx/${url}`
      : `https://stellar.expert/explorer/testnet/tx/${url}`;

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm text-blue-800">
        Transaction submitted!{" "}
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          View on Stellar Expert
        </a>
      </p>
    </div>
  );
}
