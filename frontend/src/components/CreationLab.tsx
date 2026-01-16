"use client";

import { useState } from "react";

import axios from "axios";
import { ethers } from "ethers";
import { ImagePlus, ShieldCheck, Sparkles, Upload, Zap } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEVM } from "@/hooks/useEVM";

import { ASTRA_NFT_ABI } from "@/constants/abi";
import { API_URL, MINTING_FEE, TREASURY_ADDRESS } from "@/constants/config";

export const CreationLab = () => {
  const { address, isDemo, signer, contractAddress } = useEVM();
  const [prompt, setPrompt] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [extractedName, setExtractedName] = useState<string | null>(null);
  const [extractedPrice, setExtractedPrice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<"ai" | "upload">("ai");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [hasMinted, setHasMinted] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setEnhancedPrompt(null);
    setExtractedName(null);
    setExtractedPrice(null);
    setHasMinted(false);
    const toastId = toast.loading("Agent is analyzing your intent...");
    try {
      const response = await axios.post(`${API_URL}/api/generate`, { prompt });
      setPreviewUrl(response.data.imageUrl);
      setEnhancedPrompt(response.data.enhancedPrompt);
      setExtractedName(response.data.extractedName);
      setExtractedPrice(response.data.extractedPrice);
      toast.success("Art and metadata analyzed by Astra-Neural-v1!", {
        id: toastId,
      });
    } catch (error) {
      console.error("Failed to generate art:", error);
      toast.error("Generation failed. Is the backend running?", {
        id: toastId,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setExtractedName(file.name.split(".")[0]);
        setExtractedPrice("100"); // Default price for uploads
        setHasMinted(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMint = async () => {
    if (!address) {
      toast.error("Please connect your wallet first!");
      return;
    }

    setIsMinting(true);
    const toastId = toast.loading(
      isDemo ? "Simulating mint..." : "Executing on-chain mint..."
    );
    try {
      let tokenId = "nft-" + Date.now();
      const finalName =
        extractedName || "Astra Art #" + Math.floor(Math.random() * 1000);
      const finalPrice = extractedPrice || "100";

      let signature = null;
      let message = `Minting AstraNode Art NFT: ${Date.now()}`;

      if (isDemo) {
        signature = {
          pub_key: { type: "eth", value: "demo" },
          signature: "demo_signature",
        };
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        // 1. PROFIT MECHANISM: Service Fee Payment
        toast.loading(`Sending ${MINTING_FEE} TVX Service Fee to Treasury...`, {
          id: toastId,
        });

        if (!signer)
          throw new Error("Wallet signer not found. Please reconnect.");

        try {
          const feeTx = await signer.sendTransaction({
            to: TREASURY_ADDRESS,
            value: ethers.parseEther(MINTING_FEE),
          });
          await feeTx.wait();
          console.log("Service fee paid! Hash:", feeTx.hash);
        } catch (e: any) {
          throw new Error(`Fee payment failed: ${e.message}`);
        }

        // 2. USER ONLY SIGNATURING
        toast.loading("Requesting signature for neural asset...", {
          id: toastId,
        });

        signature = await signer.signMessage(message);

        // We skip the direct contract.mint call here as per "user only signaturing"
        console.log("Signature captured for backend processing:", signature);
      }

      toast.loading("Syncing with marketplace index...", { id: toastId });

      // 1. Create Metadata (Off-chain cache)
      const metadataResponse = await axios.post(`${API_URL}/api/metadata`, {
        name: finalName,
        description:
          creationMode === "ai"
            ? "AI Generated Art on AstraNode"
            : "User Uploaded Art on AstraNode",
        ai_prompt:
          creationMode === "ai" ? enhancedPrompt || prompt : "User Upload",
        model_version:
          creationMode === "ai" ? "Astra-Neural-v1" : "User-Original",
        image_url: previewUrl,
      });

      // 2. Sync to Marketplace DB
      await axios.post(`${API_URL}/api/marketplace/sync`, {
        nft_id: tokenId,
        owner: address,
        price: finalPrice,
        denom: "uastra",
        metadata_uri: "ipfs://...",
        image_url: previewUrl,
        name: metadataResponse.data.name,
        description: metadataResponse.data.description,
        ai_prompt:
          creationMode === "ai" ? enhancedPrompt || prompt : "User Upload",
        model_version:
          creationMode === "ai" ? "Astra-Neural-v1" : "User-Original",
        signature: signature,
        message: message,
        isDemo: isDemo,
      });

      toast.success("Neural asset signed and queued for minting!", {
        id: toastId,
      });
      setHasMinted(true);
      window.dispatchEvent(new Event("nft-minted"));
    } catch (error: any) {
      console.error("Failed to mint:", error);
      toast.error(
        error.message || "Failed to mint. Check your wallet connection.",
        { id: toastId }
      );
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <section id="create" className="pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} />
            Astra-Neural AI Agent Active
          </div>

          <h1 className="text-6xl font-extrabold tracking-tight leading-tight">
            Forge Your <span className="text-gradient">Digital Legacy</span>{" "}
            with AI
          </h1>

          <p className="text-muted-foreground text-lg max-w-lg">
            AstraNode Art combines decentralized power with cutting-edge AI. Our
            Neural Agent extracts metadata and enhances your prompts.
          </p>

          <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit border border-white/10">
            <Button
              variant={creationMode === "ai" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCreationMode("ai")}
              className="rounded-lg"
            >
              <Sparkles size={14} className="mr-2" />
              AI Generate
            </Button>
            <Button
              variant={creationMode === "upload" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCreationMode("upload")}
              className="rounded-lg"
            >
              <Upload size={14} className="mr-2" />
              Upload Image
            </Button>
          </div>

          <div className="space-y-4 max-w-md">
            {creationMode === "ai" ? (
              <div className="relative">
                <Input
                  placeholder="Describe your masterpiece (e.g. 'name Vip price 120')..."
                  className="h-14 bg-secondary/50 border-white/10 pl-4 pr-32 focus:ring-primary"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <Button
                  className="absolute right-1 top-1 bottom-1 px-6"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt}
                >
                  {isGenerating ? "Agent Working..." : "Generate"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 bg-white/5 group-hover:bg-white/10 transition-colors">
                    <ImagePlus className="text-muted-foreground" size={32} />
                    <p className="text-sm text-muted-foreground">
                      Click or drag to upload your art
                    </p>
                  </div>
                </div>
                {uploadFile && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      NFT Name
                    </label>
                    <Input
                      value={extractedName || ""}
                      onChange={(e) => setExtractedName(e.target.value)}
                      placeholder="Enter NFT Name"
                      className="bg-secondary/50 border-white/10"
                    />
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      Price (uastra)
                    </label>
                    <Input
                      value={extractedPrice || ""}
                      onChange={(e) => setExtractedPrice(e.target.value)}
                      placeholder="Enter Price"
                      className="bg-secondary/50 border-white/10"
                    />
                  </div>
                )}
              </div>
            )}

            {(enhancedPrompt || extractedName) && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-500 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <Zap size={12} />
                  Agent Analysis
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/20 p-2 rounded border border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase block">
                      Extracted Name
                    </span>
                    <span className="text-sm font-medium text-white">
                      {extractedName}
                    </span>
                  </div>
                  <div className="bg-black/20 p-2 rounded border border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase block">
                      Extracted Price
                    </span>
                    <span className="text-sm font-medium text-white">
                      {extractedPrice} uastra
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">
                    Enhanced Prompt
                  </span>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    "{enhancedPrompt}"
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Zap size={12} className="text-primary" />
                Neural Optimization
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-primary" />
                On-Chain Provenance
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50"></div>
          <Card className="relative overflow-hidden border-white/10 glass">
            <CardContent className="p-0 aspect-square flex items-center justify-center bg-black/20">
              {previewUrl ? (
                <div className="relative w-full h-full group">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      onClick={handleMint}
                      disabled={isMinting || hasMinted}
                      className="neon-glow"
                    >
                      {isMinting
                        ? "Signing..."
                        : hasMinted
                        ? "Minted"
                        : "Mint as NFT"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 p-12">
                  <div className="w-20 h-20 mx-auto bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 animate-pulse">
                    <Sparkles className="text-white/20" size={40} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter a prompt to visualize your AI art
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
