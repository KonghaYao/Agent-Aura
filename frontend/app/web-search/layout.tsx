"use client";

import React from "react";
import AppLayout from "@/components/shared/AppLayout";

export default function WebSearchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppLayout title="Web Search">{children}</AppLayout>;
}
