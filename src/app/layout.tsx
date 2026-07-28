import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jinvexa AI - Autonomous Learning Platform",
  description: "Personalized AI-powered learning environment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
