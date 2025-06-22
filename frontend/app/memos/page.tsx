"use client";

import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import MemoSidebar from "./components/MemoSidebar";
import MemoDetailPanel from "./components/MemoDetailPanel";
import { Memo } from "./types";
import {
    searchMemos,
    createMemo,
    updateMemo,
    deleteMemo,
} from "./services/memoService";

export default function MemosPage() {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);

    // 加载备忘录
    useEffect(() => {
        const fetchMemos = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const results = await searchMemos(searchQuery);
                setMemos(results);

                // 如果当前选中的备忘录不在新结果中，清空选择
                if (
                    selectedMemo &&
                    !results.find((memo) => memo.key === selectedMemo.key)
                ) {
                    setSelectedMemo(null);
                }
            } catch (err) {
                setError("加载备忘录失败");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMemos();
    }, [searchQuery]);

    // 创建备忘录
    const handleCreateMemo = async (value: string) => {
        try {
            setError(null);
            const key = crypto.randomUUID();
            await createMemo(key, value);

            // 重新获取列表以确保数据同步
            const results = await searchMemos(searchQuery);
            setMemos(results);

            // 自动选中新创建的备忘录
            const newMemo = results.find((memo) => memo.key === key);
            if (newMemo) {
                setSelectedMemo(newMemo);
            }
        } catch (err) {
            setError("创建备忘录失败");
            console.error(err);
        }
    };

    // 更新备忘录
    const handleUpdateMemo = async (key: string, value: string) => {
        try {
            setError(null);
            await updateMemo(key, value);

            // 更新本地状态
            const updatedMemos = memos.map((memo) =>
                memo.key === key ? { ...memo, text: value } : memo,
            );
            setMemos(updatedMemos);

            // 更新选中的备忘录
            if (selectedMemo && selectedMemo.key === key) {
                setSelectedMemo({ ...selectedMemo, text: value });
            }
        } catch (err) {
            setError("更新备忘录失败");
            console.error(err);
        }
    };

    // 删除备忘录
    const handleDeleteMemo = async (key: string) => {
        try {
            setError(null);
            await deleteMemo(key);

            // 更新本地状态
            const updatedMemos = memos.filter((memo) => memo.key !== key);
            setMemos(updatedMemos);

            // 如果删除的是当前选中的备忘录，清空选择
            if (selectedMemo && selectedMemo.key === key) {
                setSelectedMemo(null);
            }
        } catch (err) {
            setError("删除备忘录失败");
            console.error(err);
        }
    };

    // 搜索备忘录
    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    // 选择备忘录
    const handleMemoSelect = (memo: Memo) => {
        setSelectedMemo(memo);
    };

    return (
        <div className="h-full flex flex-col">
            {error && (
                <Alert variant="destructive" className="m-4 mb-0">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex-1 flex overflow-hidden">
                <MemoSidebar
                    memos={memos}
                    selectedMemoKey={selectedMemo?.key || null}
                    onMemoSelect={handleMemoSelect}
                    onCreateMemo={handleCreateMemo}
                    onSearch={handleSearch}
                    isLoading={isLoading}
                />

                <MemoDetailPanel
                    memo={selectedMemo}
                    onUpdate={handleUpdateMemo}
                    onDelete={handleDeleteMemo}
                />
            </div>
        </div>
    );
}
