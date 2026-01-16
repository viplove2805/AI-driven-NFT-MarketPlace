"use client"

import { useCallback, useEffect, useState } from "react"

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { SigningStargateClient } from "@cosmjs/stargate"
import { Window as KeplrWindow } from "@keplr-wallet/types"

declare global {
  interface Window extends KeplrWindow {}
}

export const useCosmos = () => {
  const [address, setAddress] = useState<string | null>(null)
  const [client, setClient] = useState<SigningStargateClient | null>(null)
  const [wasmClient, setWasmClient] = useState<SigningCosmWasmClient | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectWallet = useCallback(async (walletType: "keplr" | "leap" = "keplr") => {
    setIsConnecting(true)
    setError(null)

    try {
      const wallet = walletType === "keplr" ? window.keplr : (window as any).leap

      if (!wallet) {
        throw new Error(`${walletType} wallet not found. Please install the extension.`)
      }

      const chainId = "astranode-1" // Custom Cosmos-based chain ID

      // Suggest chain if not present (simplified for MVP)
      // In a real app, you'd use wallet.experimentalSuggestChain(...)

      await wallet.enable(chainId)
      const offlineSigner = wallet.getOfflineSigner(chainId)
      const accounts = await offlineSigner.getAccounts()
      const userAddress = accounts[0].address

      const rpcEndpoint = "https://rpc.astranode.art" // Placeholder RPC

      const stargateClient = await SigningStargateClient.connectWithSigner(rpcEndpoint, offlineSigner)

      const cosmWasmClient = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, offlineSigner)

      setAddress(userAddress)
      setClient(stargateClient)
      setWasmClient(cosmWasmClient)

      localStorage.setItem("connectedWallet", walletType)
    } catch (err: any) {
      console.error("Failed to connect wallet:", err)
      setError(err.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const connectDemo = useCallback(() => {
    const mockAddress = "astra1demo" + Math.random().toString(36).substring(7)
    setAddress(mockAddress)
    setClient(null)
    setWasmClient(null)
    localStorage.setItem("connectedWallet", "demo")
    localStorage.setItem("demoAddress", mockAddress)
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setClient(null)
    setWasmClient(null)
    localStorage.removeItem("connectedWallet")
    localStorage.removeItem("demoAddress")
  }, [])

  useEffect(() => {
    const savedWallet = localStorage.getItem("connectedWallet")
    if (savedWallet === "keplr" || savedWallet === "leap") {
      connectWallet(savedWallet as "keplr" | "leap")
    } else if (savedWallet === "demo") {
      const savedAddress = localStorage.getItem("demoAddress")
      setAddress(savedAddress || "astra1demo_default")
    }
  }, [connectWallet])

  const contractAddress = "astra1v9v...placeholder" // Deploy your contract and put address here

  return {
    address,
    client,
    wasmClient,
    isConnecting,
    error,
    connectWallet,
    connectDemo,
    disconnect,
    isConnected: !!address,
    isDemo: typeof window !== "undefined" && localStorage.getItem("connectedWallet") === "demo",
    contractAddress,
    // Helper to execute contract messages
    execute: async (msg: any, funds?: { denom: string; amount: string }[]) => {
      if (!wasmClient || !address) throw new Error("Wallet not connected")
      return await wasmClient.execute(address, contractAddress, msg, "auto", undefined, funds)
    },
    // Helper to query contract state
    query: async (msg: any) => {
      if (!wasmClient) {
        // Fallback to a public RPC if not connected
        const { CosmWasmClient } = await import("@cosmjs/cosmwasm-stargate")
        const publicClient = await CosmWasmClient.connect("https://rpc.astranode.art")
        return await publicClient.queryContractSmart(contractAddress, msg)
      }
      return await wasmClient.queryContractSmart(contractAddress, msg)
    }
  }
}
