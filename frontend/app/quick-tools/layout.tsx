"use client";

import React, { Suspense } from "react";
import AppLayout from "@/components/shared/AppLayout";

export default function QuickToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppLayout title="Quick Tools">
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </AppLayout>
    );
}
