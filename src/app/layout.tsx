import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { AuctionProvider } from "../context/AuctionContext";
import { MultiplayerProvider } from "../context/MultiplayerContext";
import { Navbar } from "../components/Navbar";
import { GoogleSignInBubble } from "../components/GoogleSignInBubble";
import { VideoBackground } from "../components/VideoBackground";

export const metadata: Metadata = {
  title: "CricBid – Bid. Draft. Dominate.",
  description: "Real-time IPL-style player auctions with friends. Claim your franchise, manage your purse, and build a championship squad — live.",
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className="min-h-screen flex flex-col antialiased"
        style={{ color: '#FFFFFF', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
      >
        <AuthProvider>
          <AuctionProvider>
            <MultiplayerProvider>
              <VideoBackground />
              <Navbar />
              <main className="flex-grow w-full max-w-7xl mx-auto px-5 md:px-8 relative" style={{ zIndex: 1, paddingTop: '96px', paddingBottom: '48px' }}>
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
