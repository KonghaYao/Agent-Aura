import React from "react";
import { Memo } from "../types";
import { cn } from "@/lib/utils";

interface MemoListItemProps {
    memo: Memo;
    isSelected: boolean;
    onClick: () => void;
}

const MemoListItem: React.FC<MemoListItemProps> = ({
    memo,
    isSelected,
    onClick,
}) => {
    // 获取备忘录的预览文本（前60个字符）
    const previewText =
        memo.text.length > 60 ? memo.text.substring(0, 60) + "..." : memo.text;

    // 获取第一行作为标题
    const title = memo.text.split("\n")[0] || "无标题";
    const displayTitle =
        title.length > 35 ? title.substring(0, 35) + "..." : title;

    return (
        <div
            className={cn(
                "px-4 py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors duration-150",
                isSelected &&
                    "bg-white dark:bg-gray-800 border-r-2 border-r-blue-500 shadow-sm",
            )}
            onClick={onClick}
        >
            <div className="space-y-1.5">
                <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate leading-tight">
                    {displayTitle}
                </h3>
                <p
                    className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed"
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {previewText}
                </p>
            </div>
        </div>
    );
};

export default MemoListItem;
