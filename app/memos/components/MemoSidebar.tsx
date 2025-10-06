import React from "react";
import { Memo } from "../types";
import MemoListItem from "./MemoListItem";
import MemoForm from "./MemoForm";
import SearchBar from "./SearchBar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { BackupRestore } from "./BackupRestore";

interface MemoSidebarProps {
    memos: Memo[];
    selectedMemoKey: string | null;
    onMemoSelect: (memo: Memo) => void;
    onCreateMemo: (value: string) => void;
    onSearch: (query: string) => void;
    isLoading: boolean;
}

const MemoSidebar: React.FC<MemoSidebarProps> = ({
    memos,
    selectedMemoKey,
    onMemoSelect,
    onCreateMemo,
    onSearch,
    isLoading,
}) => {
    return (
        <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
            {/* 头部 */}
            <div className="flex-shrink-0 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        我的备忘录
                    </h1>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <Settings className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                            <BackupRestore />
                        </PopoverContent>
                    </Popover>
                </div>
                <SearchBar onSearch={onSearch} />
            </div>

            {/* 新建备忘录表单 */}
            <div className="flex-shrink-0 px-4 pb-3">
                <MemoForm onSubmit={onCreateMemo} />
            </div>

            {/* 分隔线 */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700"></div>

            {/* 备忘录列表 */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton
                                    key={i}
                                    className="h-16 w-full rounded-md"
                                />
                            ))}
                        </div>
                    ) : memos.length === 0 ? (
                        <div className="p-4 text-center">
                            <div className="text-gray-400 dark:text-gray-600 mb-2">
                                <svg
                                    className="w-12 h-12 mx-auto"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                暂无备忘录
                            </p>
                        </div>
                    ) : (
                        <div>
                            {memos.map((memo) => (
                                <MemoListItem
                                    key={memo.key}
                                    memo={memo}
                                    isSelected={selectedMemoKey === memo.key}
                                    onClick={() => onMemoSelect(memo)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemoSidebar;
