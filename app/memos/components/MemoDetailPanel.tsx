import React, { useState, useEffect } from "react";
import { Memo } from "../types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PencilIcon, CheckIcon, XIcon, TrashIcon } from "lucide-react";

interface MemoDetailPanelProps {
    memo: Memo | null;
    onUpdate: (key: string, value: string) => void;
    onDelete: (key: string) => void;
}

const MemoDetailPanel: React.FC<MemoDetailPanelProps> = ({
    memo,
    onUpdate,
    onDelete,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedValue, setEditedValue] = useState("");

    useEffect(() => {
        if (memo) {
            setEditedValue(memo.text);
            setIsEditing(false);
        }
    }, [memo]);

    const handleSave = () => {
        if (memo) {
            onUpdate(memo.key, editedValue);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        if (memo) {
            setEditedValue(memo.text);
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (memo) {
            onDelete(memo.key);
        }
    };

    if (!memo) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950">
                <div className="text-center">
                    <div className="text-gray-300 dark:text-gray-700 mb-4">
                        <svg
                            className="w-20 h-20 mx-auto"
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
                    <p className="text-gray-400 dark:text-gray-600 text-lg">
                        选择一个备忘录查看详情
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
            {/* 头部工具栏 */}
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        备忘录详情
                    </h2>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                >
                                    <XIcon className="h-4 w-4 mr-1" /> 取消
                                </Button>
                                <Button size="sm" onClick={handleSave}>
                                    <CheckIcon className="h-4 w-4 mr-1" /> 保存
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <PencilIcon className="h-4 w-4 mr-1" /> 编辑
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                >
                                    <TrashIcon className="h-4 w-4 mr-1" /> 删除
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                    <div className="p-6">
                        {isEditing ? (
                            <Textarea
                                className="w-full min-h-[500px] resize-none border-none shadow-none focus-visible:ring-0 text-base leading-relaxed p-0 bg-transparent"
                                value={editedValue}
                                onChange={(e) => setEditedValue(e.target.value)}
                                placeholder="写下你的想法..."
                                autoFocus
                            />
                        ) : (
                            <div className="prose dark:prose-invert max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-gray-900 dark:text-gray-100 bg-transparent border-none p-0 m-0">
                                    {memo.text}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemoDetailPanel;
