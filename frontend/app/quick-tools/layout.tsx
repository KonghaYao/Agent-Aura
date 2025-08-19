"use client";

import React from "react";
import AppLayout from "@/components/shared/AppLayout";

export default function QuickToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppLayout title="Quick Tools">{children}</AppLayout>;
}
