"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { useAccount, usePublicClient } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const { targetNetwork } = useTargetNetwork();
  const [privateKey, setPrivateKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [batchSize, setBatchSize] = useState(10);
  const [txResults, setTxResults] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState("");

  const handleBatchTransactions = async () => {
    if (!publicClient || !privateKey) return;

    setIsLoading(true);
    setTxResults([]);

    try {
      const privateKeyHex = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
      const account = privateKeyToAccount(privateKeyHex as `0x${string}`);

      const walletClient = createWalletClient({
        chain: targetNetwork,
        transport: http(`https://monad-testnet.g.alchemy.com/v2/${apiKey}`),
        account,
      });

      const walletAddress = account.address;

      const BATCH_SIZE = batchSize;
      const nonce = await publicClient.getTransactionCount({ address: walletAddress });

      const transactions = Array(BATCH_SIZE)
        .fill(null)
        .map(async (_, index) => {
          return await walletClient.sendTransaction({
            account,
            to: walletAddress, // Sending to self for demo
            value: parseEther("0.0001"), // 0.0001 MON
            gasLimit: BigInt(21000), // 21000 gas limit
            baseFeePerGas: BigInt(50000000000), // 50 gwei
            chain: targetNetwork,
            nonce: nonce + Number(index),
          });
        });

      const hashes = await Promise.all(transactions);
      console.log("Batch transaction hashes:", hashes);
      setTxResults(hashes);
      alert(`${BATCH_SIZE} batch transactions sent! Check console for hashes.`);
    } catch (error) {
      console.error("Error sending batch transactions:", error);
      alert("Error sending batch transactions. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-5">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
            <span className="block text-lg mb-2">Foundry Edition + Monad Testnet Config</span>
            <span className="block text-md mb-2">batch transactions example</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>

          <div className="flex flex-col items-center mt-4 gap-3 w-full max-w-md mx-auto">
            <input
              type="password"
              placeholder="Enter Private Key"
              className="input input-bordered w-full"
              value={privateKey}
              onChange={e => setPrivateKey(e.target.value)}
            />
            <div className="text-xs text-gray-500">
              <div>Note: Never expose your private key in production. This is for demonstration purposes only.</div>
              <div>Check packages/nextjs/page.tsx for the code.</div>
            </div>

            <input
              type="text"
              placeholder="Enter Alchemy API Key"
              className="input input-bordered w-full"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <div className="text-xs text-gray-500">
              Get your own API key for Monad Testnet from{" "}
              <a
                href="https://www.alchemy.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary"
              >
                Alchemy
              </a>
            </div>

            <div className="w-full">
              <label className="label">
                <span className="label-text">Batch Size: {batchSize}</span>
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={batchSize}
                onChange={e => setBatchSize(parseInt(e.target.value))}
                className="range range-primary"
              />
              <div className="w-full flex justify-between text-xs px-2">
                <span>1</span>
                <span>10</span>
                <span>20</span>
                <span>30</span>
              </div>
            </div>

            <div className="text-sm mt-2 text-center">
              <p>
                <strong>Batch Size Considerations:</strong>
              </p>
              <ul className="list-disc text-left pl-5 mt-1">
                <li>Maximum of 30 transactions to avoid API rate limits (429 errors)</li>
                <li>Each transaction requires a unique nonce</li>
                <li>You could submit more if you had an api with a larger request limit.</li>
              </ul>
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={handleBatchTransactions}
              disabled={!publicClient || !privateKey || isLoading}
            >
              {isLoading ? <span className="loading loading-spinner loading-sm"></span> : null}
              Send {batchSize} Batch Transactions
            </button>

            {txResults.length > 0 && (
              <div className="mt-4 w-full">
                <h3 className="text-lg font-medium mb-2">Transaction Hashes:</h3>
                <div className="bg-base-300 p-3 rounded-lg max-h-40 overflow-y-auto text-xs">
                  {txResults.map((hash, index) => (
                    <div key={index} className="mb-1">
                      <span className="font-medium">{index + 1}:</span> {hash}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
