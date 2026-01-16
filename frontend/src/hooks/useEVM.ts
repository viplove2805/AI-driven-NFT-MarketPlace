"use client";

import { useCallback, useEffect, useState } from "react";

import { ethers } from "ethers";
import toast from "react-hot-toast";

declare global {
  interface Window {
    ethereum: any;
  }
}

export const useEVM = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = "0x117f719fd50D914c23e0461c3c37274f0F5E1fDC";

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error("MetaMask not found. Please install the extension.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const userSigner = await browserProvider.getSigner();

      setAddress(accounts[0]);
      setProvider(browserProvider);
      setSigner(userSigner);

      localStorage.setItem("connectedWallet", "metamask");
    } catch (err: any) {
      console.error("Failed to connect EVM wallet:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const connectDemo = useCallback(() => {
    const mockAddress = "0xdemo" + Math.random().toString(16).substring(2, 12);
    setAddress(mockAddress);
    setProvider(null);
    setSigner(null);
    localStorage.setItem("connectedWallet", "demo");
    localStorage.setItem("demoAddress", mockAddress);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    localStorage.removeItem("connectedWallet");
    localStorage.removeItem("demoAddress");
  }, []);

  useEffect(() => {
    const savedWallet = localStorage.getItem("connectedWallet");
    if (savedWallet === "metamask") {
      connectWallet();
    } else if (savedWallet === "demo") {
      const savedAddress = localStorage.getItem("demoAddress");
      setAddress(savedAddress || "0xdemo_default");
    }
  }, [connectWallet]);

  return {
    address,
    provider,
    signer,
    isConnecting,
    error,
    connectWallet,
    connectDemo,
    disconnect,
    isConnected:
      !!address &&
      typeof window !== "undefined" &&
      (localStorage.getItem("connectedWallet") === "demo" || !!signer),
    isDemo:
      typeof window !== "undefined" &&
      localStorage.getItem("connectedWallet") === "demo",
    contractAddress,
  };
};
