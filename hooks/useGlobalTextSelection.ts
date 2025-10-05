"use client";

import { useEffect } from "react";
import { useSelectionPrompt } from "@/context/SelectionPromptContext";

export function useGlobalTextSelection() {
    const { showDialog } = useSelectionPrompt();

    useEffect(() => {
        let selectionTimeout: NodeJS.Timeout;

        const handleSelectionChange = () => {
            // 清除之前的延时器
            if (selectionTimeout) {
                clearTimeout(selectionTimeout);
            }

            // 延时处理，避免频繁触发
            selectionTimeout = setTimeout(() => {
                const selection = window.getSelection();
                if (!selection || selection.isCollapsed) {
                    return;
                }

                const selectedText = selection.toString().trim();
                if (!selectedText || selectedText.length < 3) {
                    return;
                }

                // 获取选择范围的位置
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                // 计算弹窗位置 (在选择文本的右下方)
                const position = {
                    x: rect.right + 10,
                    y: rect.bottom + 10,
                };

                // 确保弹窗不会超出屏幕边界
                const popupWidth = 384; // max-w-md ≈ 384px
                const popupHeight = 300; // 预估高度
                const adjustedPosition = {
                    x: Math.min(
                        Math.max(10, position.x),
                        window.innerWidth - popupWidth - 10,
                    ),
                    y: Math.min(
                        Math.max(10, position.y),
                        window.innerHeight - popupHeight - 10,
                    ),
                };

                showDialog(selectedText, adjustedPosition);
            }, 300); // 300ms 延时
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // ESC 键关闭弹窗等其他快捷键可以在这里处理
            if (e.key === "Escape") {
                // 如果需要ESC关闭，可以在这里添加逻辑
            }
        };

        // 监听选择变化事件
        document.addEventListener("selectionchange", handleSelectionChange);
        document.addEventListener("keydown", handleKeyDown);

        // 清理函数
        return () => {
            if (selectionTimeout) {
                clearTimeout(selectionTimeout);
            }
            document.removeEventListener(
                "selectionchange",
                handleSelectionChange,
            );
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [showDialog]);
}
