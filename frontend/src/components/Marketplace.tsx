"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import axios from "axios";
import { Eye, ShoppingCart, User } from "lucide-react";
import toast from "react-hot-toast";
import { API_URL } from "@/constants/config";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

export const Marketplace = () => {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleBuy = (item: Listing) => {
    router.push(`/nft/${item.nft_id}`);
  };

  const handleView = (item: Listing) => {
    router.push(`/nft/${item.nft_id}`);
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/marketplace`);
        setListings(response.data);
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, []);

  return (
    <section id="marketplace" className="py-20 px-4 bg-black/20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Live <span className="text-primary">Marketplace</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Discover the latest AI-generated masterpieces on AstraNode.
            </p>
          </div>
          {/* <Button
            variant="outline"
            className="border-white/10"
            onClick={() => toast("View All coming soon!", { icon: "🚀" })}
          >
            View All
          </Button> */}
        </div>

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
                  className="group bg-card/30 border-white/5 overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Link href={`/nft/${item.nft_id}`}>
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                      />
                    </Link>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-primary">
                        {item.price} {item.denom.replace("u", "").toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <Link href={`/nft/${item.nft_id}`}>
                      <h3 className="font-bold text-lg truncate hover:text-primary transition-colors cursor-pointer">
                        {item.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <User size={12} />
                      <span className="truncate">
                        {item.owner.slice(0, 12)}...
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 italic">
                      "{item.ai_prompt}"
                    </p>
                  </CardContent>

                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 bg-white/5 hover:bg-white/10 border-white/5"
                      onClick={() => handleView(item)}
                    >
                      <Eye size={14} className="mr-2" />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleBuy(item)}
                    >
                      <ShoppingCart size={14} className="mr-2" />
                      Buy
                    </Button>
                  </CardFooter>
                </Card>
              ))}
        </div>
      </div>
    </section>
  );
};
