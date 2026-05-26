import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { AuctionProvider } from "../context/AuctionContext";
import { MultiplayerProvider } from "../context/MultiplayerContext";
import { Navbar } from "../components/Navbar";
import { GoogleSignInBubble } from "../components/GoogleSignInBubble";

export const metadata: Metadata = {
  title: "CricBid - Premium Live Auction Simulator",
  description: "Experience the ultimate cricket draft arena. Claim your franchise, bid in real-time, and draft your elite Playing XI on the CricBid studio broadcast platform.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#0F172A] text-[#F8FAFC] relative antialiased">
        <div className="studio-bg">
          <div className="stadium-texture"></div>
        </div>
        <AuthProvider>
          <AuctionProvider>
            <MultiplayerProvider>
              <Navbar />
              <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto relative z-10">
                {children}
              </main>
              <GoogleSignInBubble />
            </MultiplayerProvider>
          </AuctionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
