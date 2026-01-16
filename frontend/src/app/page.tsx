import { CreationLab } from "@/components/CreationLab"
import { Marketplace } from "@/components/Marketplace"
import { Navbar } from "@/components/Navbar"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <CreationLab />
      <Marketplace />

      <footer className="py-12 border-t border-white/5 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 AstraNode Art. Powered by AstraNode Blockchain & Neural Engine.</p>
        </div>
      </footer>
    </main>
  )
}
