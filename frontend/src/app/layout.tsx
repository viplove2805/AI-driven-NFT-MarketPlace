import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";

import "./globals.css";

export const metadata: Metadata = {
  title: "AstraNode Art | AI NFT Marketplace",
  description:
    "The premier marketplace for AI-generated art on the AstraNode blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#121212",
              color: "#fff",
              border: "1px solid #333",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
