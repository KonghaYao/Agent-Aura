"use client";

import React, { ReactNode } from "react";
import { SelectionPromptProvider } from "@/context/SelectionPromptContext";
import { SelectionPromptDialog } from "@/components/shared/SelectionPromptDialog";
import { useGlobalTextSelection } from "@/hooks/useGlobalTextSelection";

// 内部组件，负责初始化文本选择监听
function SelectionListener() {
    useGlobalTextSelection();
    return null;
}

interface GlobalSelectionProviderProps {
    children: ReactNode;
}

export function GlobalSelectionProvider({
    children,
}: GlobalSelectionProviderProps) {
    return (
        <SelectionPromptProvider>
            {/* 应用的主要内容 */}
            {children}

            {/* 文本选择监听器 */}
            <SelectionListener />

            {/* 全局弹窗 */}
            <SelectionPromptDialog />
        </SelectionPromptProvider>
    );
}
