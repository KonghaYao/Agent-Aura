import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/context/AuthContext";

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
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
