import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Marketing OS",
  description: "Panel de control de marketing de CR Consultores Colombia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body suppressHydrationWarning className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
