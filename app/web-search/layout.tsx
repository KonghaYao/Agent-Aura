"use client";

import React, { Suspense } from "react";
import AppLayout from "@/components/shared/AppLayout";

export default function WebSearchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppLayout title="Web Search">
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </AppLayout>
    );
}
