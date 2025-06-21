import React from "react";
import { Memo } from "../types";
import MemoItem from "./MemoItem";
import { Skeleton } from "@/components/ui/skeleton";

interface MemoListProps {
    memos: Memo[];
    onDelete: (key: string) => void;
    onUpdate: (key: string, value: string) => void;
    isLoading: boolean;
}

const MemoList: React.FC<MemoListProps> = ({
    memos,
    onDelete,
    onUpdate,
    isLoading,
}) => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[120px] w-full rounded-md" />
                ))}
            </div>
        );
    }

    if (memos.length === 0) {
        return (
            <div className="text-center py-10 border rounded-md border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                    暂无备忘录，开始创建吧！
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {memos.map((memo) => (
                <MemoItem
                    key={memo.key}
                    memo={memo}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                />
            ))}
        </div>
    );
};

export default MemoList;
