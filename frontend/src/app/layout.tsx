import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeleHealth - Telemedicine for Low-Bandwidth Areas",
  description: "A telemedicine platform with advanced AI features designed for low-bandwidth areas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
