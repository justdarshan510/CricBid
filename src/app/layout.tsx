import type { Metadata } from "next";
import "./globals.css";
import { AuctionProvider } from "../context/AuctionContext";
import { MultiplayerProvider } from "../context/MultiplayerContext";
import { Navbar } from "../components/Navbar";

export const metadata: Metadata = {
  title: "AI-Powered IPL Live Auction Simulator",
  description: "Live bidding simulation room. Select your franchise, bid against AI opponents, upload custom CSV databases, and build your dream Playing XI using AI squad balancing insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <AuctionProvider>
          <MultiplayerProvider>
            <Navbar />
            <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </MultiplayerProvider>
        </AuctionProvider>
      </body>
    </html>
  );
}
