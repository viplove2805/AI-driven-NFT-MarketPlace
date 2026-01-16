"use client"

import { MyCollection } from "@/components/MyCollection"
import { Navbar } from "@/components/Navbar"

export default function CollectionPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20">
        <MyCollection />
      </div>

      <footer className="py-12 border-t border-white/5 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 AstraNode Art. Powered by AstraNode Blockchain & Neural Engine.</p>
        </div>
      </footer>
    </main>
  )
}
