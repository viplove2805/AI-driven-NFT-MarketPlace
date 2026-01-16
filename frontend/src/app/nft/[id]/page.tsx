"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import axios from "axios";
import { ethers } from "ethers";
import {
  ArrowLeft,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tag,
  User,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  API_URL,
  MARKETPLACE_COMMISSION_PERCENT,
  TREASURY_ADDRESS,
} from "@/constants/config";

import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEVM } from "@/hooks/useEVM";

import { ASTRA_NFT_ABI } from "@/constants/abi";

interface Listing {
  id: number;
  nft_id: string;
  owner: string;
  price: string;
  denom: string;
  image_url: string;
  name: string;
  description: string;
  ai_prompt: string;
  model_version: string;
}

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected, isDemo, signer, contractAddress } = useEVM();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    const fetchNFT = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/marketplace`);
        const item = response.data.find((l: Listing) => l.nft_id === params.id);
        if (item) {
          setListing(item);
        } else {
          toast.error("NFT not found");
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to fetch NFT details:", error);
        toast.error("Failed to load NFT details");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) fetchNFT();
  }, [params.id, router]);

  const handleBuy = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first!");
      return;
    }

    if (address === listing?.owner) {
      toast.error("You already own this NFT!");
      return;
    }

    setIsBuying(true);
    const toastId = toast.loading(
      isDemo ? "Simulating purchase..." : "Initiating transaction..."
    );

    try {
      if (!isDemo) {
        // REAL ON-CHAIN PURCHASE (EVM)
        toast.loading("Broadcasting buy transaction to EVM Chain...", {
          id: toastId,
        });

        try {
          if (!signer)
            throw new Error("Wallet signer not found. Please reconnect.");

          // PROFIT MECHANISM: Commission Split
          const totalPrice = ethers.parseEther(listing?.price || "0");
          const commission =
            (totalPrice *
              BigInt(Math.floor(MARKETPLACE_COMMISSION_PERCENT * 10))) /
            BigInt(1000);
          const sellerProceeds = totalPrice - commission;

          toast.loading(
            `Splitting payment: ${MARKETPLACE_COMMISSION_PERCENT}% to Treasury...`,
            {
              id: toastId,
            }
          );

          // 1. Send Commission to Treasury
          const commissionTx = await signer.sendTransaction({
            to: TREASURY_ADDRESS,
            value: commission,
          });
          await commissionTx.wait();

          // 2. Send Proceeds to Seller
          const sellerTx = await signer.sendTransaction({
            to: listing?.owner as string,
            value: sellerProceeds,
          });
          await sellerTx.wait();

          console.log("Purchase complete! Commission paid to treasury.");

          // 3. AUTHENTICATION: Request signature to update ownership in backend
          toast.loading("Authenticating purchase for registry...", {
            id: toastId,
          });
          const message = `Purchase NFT ${listing?.nft_id} for ${listing?.price} ${listing?.denom}`;
          const signature = await signer.signMessage(message);

          // 4. SYNC: Update ownership in the backend
          await axios.post(`${API_URL}/api/marketplace/sync`, {
            ...listing,
            owner: address,
            isDemo: isDemo,
            signature: signature,
            message: message,
          });

          toast.success("Purchase successful! You now own this masterpiece.", {
            id: toastId,
          });
          router.push("/collection");
        } catch (e: any) {
          console.error("Purchase error details:", e);
          toast.error(e.message || "Transaction failed. Please try again.", {
            id: toastId,
          });
        }
      } else {
        // Demo mode logic
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await axios.post(`${API_URL}/api/marketplace/sync`, {
          ...listing,
          owner: address,
          isDemo: true,
          signature: "demo",
          message: "Demo Purchase",
        });
        toast.success("Demo purchase successful!", { id: toastId });
        router.push("/collection");
      }
    } catch (error: any) {
      console.error("Outer purchase failed:", error);
      toast.error(error.message || "Transaction failed. Please try again.", {
        id: toastId,
      });
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto pt-32 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!listing) return null;

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto pt-32 pb-20 px-4">
        <Button
          variant="ghost"
          className="mb-8 text-muted-foreground hover:text-primary"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Image */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <Card className="relative overflow-hidden border-white/10 glass rounded-3xl">
              <img
                src={listing.image_url}
                alt={listing.name}
                className="w-full aspect-square object-cover"
              />
            </Card>
          </div>

          {/* Right: Details */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Sparkles size={12} className="mr-1" />
                  AI Generated
                </Badge>
                <Badge variant="outline" className="border-white/10">
                  {listing.model_version}
                </Badge>
              </div>
              <h1 className="text-5xl font-bold tracking-tight mb-4">
                {listing.name}
              </h1>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 w-fit">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-primary to-purple-500 flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Current Owner
                  </p>
                  <p className="text-sm font-mono">
                    {listing.owner === address
                      ? "You"
                      : `${listing.owner.slice(0, 12)}...${listing.owner.slice(
                          -4
                        )}`}
                  </p>
                </div>
              </div>
            </div>

            <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <Tag size={14} /> Current Price
                    </p>
                    <p className="text-4xl font-bold text-gradient">
                      {listing.price}{" "}
                      <span className="text-lg font-normal text-muted-foreground uppercase">
                        {listing.denom}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">
                      Network Fee
                    </p>
                    <p className="text-sm font-medium">
                      ~0.001 {listing.denom}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full h-16 text-lg font-bold neon-glow"
                  onClick={handleBuy}
                  disabled={isBuying || address === listing.owner}
                >
                  {isBuying
                    ? "Processing..."
                    : address === listing.owner
                    ? "You Own This"
                    : "Buy Now"}
                  {!isBuying && address !== listing.owner && (
                    <ShoppingCart className="ml-2" size={20} />
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Zap size={18} className="text-primary" />
                Neural Prompt
              </h3>
              <div className="p-4 rounded-2xl bg-secondary/50 border border-white/5 italic text-muted-foreground leading-relaxed">
                "{listing.ai_prompt}"
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
                <ShieldCheck className="text-primary mb-2" size={20} />
                <h4 className="text-sm font-bold">Authenticity</h4>
                <p className="text-xs text-muted-foreground">
                  Verified on AstraNode-1
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
                <Sparkles className="text-primary mb-2" size={20} />
                <h4 className="text-sm font-bold">AI Engine</h4>
                <p className="text-xs text-muted-foreground">
                  {listing.model_version}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
