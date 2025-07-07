import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/context/AuthContext";
import { GlobalSelectionProvider } from "@/components/providers/GlobalSelectionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Agent Aura",
    description: "一个超现代的 AI Agent，能够在日常生活中给你帮助",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-CN">
            <body className={inter.className}>
                <AuthProvider>
                    <GlobalSelectionProvider>
                        {children}
                    </GlobalSelectionProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
