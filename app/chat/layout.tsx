"use client";

import React from "react";
import AppLayout from "@/components/shared/AppLayout";

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppLayout title="Aura">{children}</AppLayout>;
}
