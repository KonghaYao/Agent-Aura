"use client";

import React, { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import MemoForm from "./components/MemoForm";
import MemoList from "./components/MemoList";
import SearchBar from "./components/SearchBar";
import { Memo } from "./types";
import {
    searchMemos,
    createMemo,
    updateMemo,
    deleteMemo,
} from "./services/memoService";

export default function MemosPage() {
    const [memos, setMemos] = useState<Memo[]>([]);
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
            setMemos(
                memos.map((memo) =>
                    memo.key === key ? { ...memo, text: value } : memo,
                ),
            );
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
            setMemos(memos.filter((memo) => memo.key !== key));
        } catch (err) {
            setError("删除备忘录失败");
            console.error(err);
        }
    };

    // 搜索备忘录
    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    return (
        <div className="h-full overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">我的备忘录</h1>
                    <p className="text-muted-foreground">记录你的想法和灵感</p>
                </div>

                <Separator className="my-6" />

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <MemoForm onSubmit={handleCreateMemo} />

                <SearchBar onSearch={handleSearch} />

                <MemoList
                    memos={memos}
                    onDelete={handleDeleteMemo}
                    onUpdate={handleUpdateMemo}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
