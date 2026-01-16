"use client"

import Link from "next/link"

import { Cpu, LogOut, Wallet } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { useEVM } from "@/hooks/useEVM"

export const Navbar = () => {
  const { address, isConnecting, connectWallet, connectDemo, disconnect, isConnected } = useEVM()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center neon-glow">
            <Cpu className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tighter text-gradient">ASTRANODE ART</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/#marketplace" className="text-sm font-medium hover:text-primary transition-colors">
            Marketplace
          </Link>
          <Link href="/#create" className="text-sm font-medium hover:text-primary transition-colors">
            Create
          </Link>
          <Link href="/collection" className="text-sm font-medium hover:text-primary transition-colors">
            My Collection
          </Link>

          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-secondary rounded-full border border-white/5 text-xs font-mono">
                {address?.slice(0, 8)}...{address?.slice(-4)}
              </div>
              <Button variant="ghost" size="icon" onClick={disconnect}>
                <LogOut size={18} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={() => connectWallet()} disabled={isConnecting} className="neon-glow">
                <Wallet className="mr-2" size={18} />
                {isConnecting ? "Connecting..." : "Connect MetaMask"}
              </Button>
              <Button variant="outline" onClick={connectDemo} className="border-white/10">
                Demo Wallet
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
