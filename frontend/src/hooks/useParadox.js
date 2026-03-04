import { useReadContract, useReadContracts } from "wagmi";
import { polygon } from "wagmi/chains";
import { CONTRACT_ADDRESSES } from "../contracts/addresses.js";
import TokenABI from "../contracts/ParadoxToken.json";
import EpochABI from "../contracts/EpochController.json";

const tokenContract  = { address: CONTRACT_ADDRESSES.ParadoxToken,    abi: TokenABI.abi,  chainId: polygon.id };
const epochContract  = { address: CONTRACT_ADDRESSES.EpochController,  abi: EpochABI.abi,  chainId: polygon.id };

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
const isDeployed = CONTRACT_ADDRESSES.ParadoxToken !== ZERO_ADDR;

// Common query options — staleTime:0 forces re-render on every poll hit
const q = (interval) => ({ enabled: isDeployed, staleTime: 0, refetchInterval: interval });

export function useTokenStats() {
  const { data, isLoading } = useReadContracts({
    contracts: [
      { ...tokenContract, functionName: "totalSupply" },
      { ...tokenContract, functionName: "name" },
      { ...tokenContract, functionName: "symbol" },
      { ...tokenContract, functionName: "decimals" },
    ],
    query: q(30_000),
  });

  return {
    isDeployed,
    isLoading,
    totalSupply: data?.[0]?.result,
    name:        data?.[1]?.result ?? "PARADOX",
    symbol:      data?.[2]?.result ?? "PDX",
    decimals:    data?.[3]?.result ?? 18,
  };
}

export function useTreasuryBalance() {
  const { data, isLoading } = useReadContract({
    ...tokenContract,
    functionName: "balanceOf",
    args: [CONTRACT_ADDRESSES.DAO_TREASURY],
    query: q(60_000),
  });
  return { balance: data, isLoading };
}

export function useEpochData() {
  // Batch the first 4 calls into one multicall to reduce RPC round-trips
  const { data: batch, isLoading: epochLoading } = useReadContracts({
    contracts: [
      { ...epochContract, functionName: "getCurrentEpoch" },
      { ...epochContract, functionName: "currentEpochId" },
      { ...epochContract, functionName: "timeUntilEpochEnd" },
      { ...epochContract, functionName: "currentEmissionRate" },
    ],
    query: q(15_000),
  });

  const epochData    = batch?.[0]?.result;
  const epochId      = batch?.[1]?.result;
  const timeLeft     = batch?.[2]?.result;
  const emissionRate = batch?.[3]?.result;

  const { data: liveCCI } = useReadContract({
    ...epochContract,
    functionName: "computeCCI",
    args: [epochId ?? 0n],
    query: { enabled: isDeployed && epochId != null, staleTime: 0, refetchInterval: 15_000 },
  });

  // wagmi v2 + viem returns named struct fields as an object
  const epoch = epochData
    ? {
        startTime:         epochData.startTime,
        endTime:           epochData.endTime,
        totalLocked:       epochData.totalLocked,
        totalBurned:       epochData.totalBurned,
        circulatingSupply: epochData.circulatingSupply,
        emission:          epochData.emission,
        cci:               epochData.cci,
        burnMultiplierBps: epochData.burnMultiplierBps,
        finalized:         epochData.finalized,
      }
    : null;

  return {
    isDeployed,
    isLoading: epochLoading,
    epoch,
    epochId:      epochId != null ? Number(epochId) : null,
    timeLeft:     timeLeft != null ? Number(timeLeft) : null,
    emissionRate,
    liveCCI:      liveCCI != null ? Number(liveCCI) : null,
  };
}
