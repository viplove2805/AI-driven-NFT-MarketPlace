"use client";

import { useCallback, useEffect, useState } from "react";

import axios from "axios";
import { ethers } from "ethers";
import { Eye, Package, Plus, Tag, Trash2, User } from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEVM } from "@/hooks/useEVM";

import { ASTRA_NFT_ABI } from "@/constants/abi";
import { API_URL } from "@/constants/config";

interface Listing {
  id: number;
  nft_id: string;
  owner: string;
  price: string;
  denom: string;
  image_url: string;
  name: string;
  ai_prompt: string;
  model_version: string;
}

export const MyCollection = () => {
  const { address, isConnected, signer, contractAddress, isDemo } = useEVM();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedNft, setSelectedNft] = useState<Listing | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

  const fetchMyListings = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/marketplace`);
      const myItems = response.data.filter(
        (item: Listing) => item.owner.toLowerCase() === address.toLowerCase()
      );
      setListings(myItems);
    } catch (error) {
      console.error("Failed to fetch collection:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const handleUpdatePrice = async () => {
    if (!selectedNft || !newPrice) return;
    setIsUpdating(true);
    const toastId = toast.loading("Updating price on-chain...");
    try {
      if (!isDemo) {
        // Note: The new ERC1155 contract doesn't have on-chain price management.
        // We sync the price update with the backend marketplace index.
        /*
        const contract = new ethers.Contract(contractAddress, ASTRA_NFT_ABI, signer);
        const tokenId = selectedNft.nft_id.replace("nft-", "");
        const tx = await contract.updatePrice(tokenId, ethers.parseEther(newPrice));
        await tx.wait();
        */
      }

      // Sync with backend
      const message = `Update Price for NFT ${selectedNft.nft_id}: ${newPrice}`;
      const signature = isDemo ? "demo" : await signer.signMessage(message);

      await axios.post(`${API_URL}/api/marketplace/update`, {
        nft_id: selectedNft.nft_id,
        price: newPrice,
        owner: address,
        signature,
        message,
        action: "update_price",
      });

      toast.success("Price updated successfully!", { id: toastId });
      setIsPriceModalOpen(false);
      fetchMyListings();
    } catch (error: any) {
      toast.error(error.message || "Failed to update price", { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelist = async (nft: Listing) => {
    if (!confirm("Are you sure you want to delist this NFT?")) return;
    const toastId = toast.loading("Delisting from blockchain...");
    try {
      if (!isDemo) {
        // Note: The new ERC1155 contract doesn't have on-chain delisting.
        // We sync the delisting with the backend marketplace index.
        /*
        const contract = new ethers.Contract(contractAddress, ASTRA_NFT_ABI, signer);
        const tokenId = nft.nft_id.replace("nft-", "");
        const tx = await contract.delistNFT(tokenId);
        await tx.wait();
        */
      }

      // Sync with backend
      const message = `Delist NFT ${nft.nft_id}`;
      const signature = isDemo ? "demo" : await signer.signMessage(message);

      await axios.post(`${API_URL}/api/marketplace/update`, {
        nft_id: nft.nft_id,
        owner: address,
        signature,
        message,
        action: "delist",
      });

      toast.success("NFT delisted from marketplace!", { id: toastId });
      fetchMyListings();
    } catch (error: any) {
      toast.error(error.message || "Failed to delist", { id: toastId });
    }
  };

  useEffect(() => {
    fetchMyListings();

    // Listen for new mints
    window.addEventListener("nft-minted", fetchMyListings);
    return () => window.removeEventListener("nft-minted", fetchMyListings);
  }, [fetchMyListings]);

  if (!isConnected) return null;

  return (
    <section id="collection" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
              <Package className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                My <span className="text-primary">Collection</span>
              </h2>
              <p className="text-muted-foreground mt-1">
                Your unique AI-generated neural assets.
              </p>
            </div>
          </div>
          <Button
            className="neon-glow h-12 px-8 rounded-xl font-bold"
            onClick={() =>
              document
                .getElementById("create")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Plus size={18} className="mr-2" />
            Mint New NFT
          </Button>
        </div>

        {listings.length === 0 && !isLoading ? (
          <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-white/5">
            <Package className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-xl font-medium">No NFTs found</h3>
            <p className="text-muted-foreground mt-2">
              Start creating in the Lab to build your collection!
            </p>
            <Button
              variant="outline"
              className="mt-6 border-white/10"
              onClick={() =>
                document
                  .getElementById("create")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Go to Creation Lab
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading
              ? Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <Card
                      key={i}
                      className="bg-card/50 border-white/5 overflow-hidden"
                    >
                      <Skeleton className="aspect-square w-full" />
                      <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))
              : listings.map((item) => (
                  <Card
                    key={item.id}
                    className="group bg-card/30 border-white/5 overflow-hidden hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-primary/20 backdrop-blur-md border-primary/30 text-primary">
                          Owned
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <User size={12} />
                        <span className="truncate">You</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2 italic">
                        "{item.ai_prompt}"
                      </p>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 bg-white/5 hover:bg-white/10 border-white/5"
                          onClick={() => {
                            setSelectedNft(item);
                            setNewPrice(item.price);
                            setIsPriceModalOpen(true);
                          }}
                        >
                          <Tag size={14} className="mr-2" />
                          Update Price
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-500"
                          onClick={() => handleDelist(item)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground hover:text-white"
                        onClick={() =>
                          toast(`Viewing ${item.name}`, { icon: "👁️" })
                        }
                      >
                        <Eye size={14} className="mr-2" />
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
          </div>
        )}
      </div>

      <Dialog open={isPriceModalOpen} onOpenChange={setIsPriceModalOpen}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>Update Listing Price</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                New Price (ETH)
              </label>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.1"
                className="bg-secondary/50 border-white/10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This will update the price on the blockchain and the marketplace
              index.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPriceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePrice}
              disabled={isUpdating}
              className="neon-glow"
            >
              {isUpdating ? "Updating..." : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
