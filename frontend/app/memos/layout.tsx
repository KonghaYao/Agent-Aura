import type { Metadata } from "next";
import AppLayout from "@/components/shared/AppLayout";

export const metadata: Metadata = {
    title: "备忘录 - Agent Aura",
    description: "记录你的想法和灵感",
};

export default function MemosLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AppLayout title="Aura">{children}</AppLayout>;
}
