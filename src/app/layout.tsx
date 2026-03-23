import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema QR - Fiesta",
  description: "Sistema de check-in con QR para eventos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
