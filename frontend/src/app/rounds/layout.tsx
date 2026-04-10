import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Rounds",
  description: "Histórico de rodadas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-full flex flex-col">{children}</div>;
}
