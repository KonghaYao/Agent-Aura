"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    downloadBackup,
    restoreFromFile,
    getBackupInfo,
    BackupData,
} from "../services/memoService";
import {
    Download,
    Upload,
    AlertTriangle,
    CheckCircle,
    Info,
} from "lucide-react";

interface RestoreResult {
    imported: number;
    skipped: number;
    updated: number;
    errors: string[];
}

export function BackupRestore() {
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(
        null,
    );
    const [backupInfo, setBackupInfo] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [restoreOptions, setRestoreOptions] = useState({
        clearExisting: false,
        skipDuplicates: true,
        updateExisting: false,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 下载备份
    const handleDownloadBackup = async () => {
        setIsBackingUp(true);
        try {
            await downloadBackup();
            // 可以添加成功提示
        } catch (error) {
            console.error("备份失败:", error);
            alert(
                "备份失败: " +
                    (error instanceof Error ? error.message : String(error)),
            );
        } finally {
            setIsBackingUp(false);
        }
    };

    // 文件选择处理
    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setBackupInfo(null);
        setRestoreResult(null);

        try {
            const info = await getBackupInfo(file);
            setBackupInfo(info);
        } catch (error) {
            console.error("读取备份文件失败:", error);
            alert(
                "读取备份文件失败: " +
                    (error instanceof Error ? error.message : String(error)),
            );
            setSelectedFile(null);
        }
    };

    // 执行恢复
    const handleRestore = async () => {
        if (!selectedFile) return;

        setIsRestoring(true);
        try {
            const result = await restoreFromFile(selectedFile, restoreOptions);
            setRestoreResult(result);
        } catch (error) {
            console.error("恢复失败:", error);
            alert(
                "恢复失败: " +
                    (error instanceof Error ? error.message : String(error)),
            );
        } finally {
            setIsRestoring(false);
        }
    };

    // 重置状态
    const resetState = () => {
        setSelectedFile(null);
        setBackupInfo(null);
        setRestoreResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-6">
            {/* 备份部分 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        备份数据
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                        将所有备忘录导出为JSON文件，可用于备份或迁移数据。
                    </p>
                    <Button
                        onClick={handleDownloadBackup}
                        disabled={isBackingUp}
                        className="w-full sm:w-auto"
                    >
                        {isBackingUp ? "正在备份..." : "下载备份文件"}
                    </Button>
                </CardContent>
            </Card>

            {/* 恢复部分 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        恢复数据
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                        从备份文件恢复备忘录数据。请选择之前导出的JSON备份文件。
                    </p>

                    {/* 文件选择 */}
                    <div>
                        <Input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileSelect}
                            className="cursor-pointer"
                        />
                    </div>

                    {/* 备份信息显示 */}
                    {backupInfo && (
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">
                                        备份文件信息
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>版本: {backupInfo.version}</div>
                                    <div>应用版本: {backupInfo.appVersion}</div>
                                    <div>
                                        备忘录数量: {backupInfo.totalCount}
                                    </div>
                                    <div>
                                        导出时间:{" "}
                                        {new Date(
                                            backupInfo.timestamp,
                                        ).toLocaleString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 恢复选项 */}
                    {selectedFile && (
                        <div className="space-y-3">
                            <h4 className="font-medium">恢复选项</h4>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={restoreOptions.clearExisting}
                                    onChange={(e) =>
                                        setRestoreOptions((prev) => ({
                                            ...prev,
                                            clearExisting: e.target.checked,
                                        }))
                                    }
                                />
                                <span className="text-sm">
                                    清空现有数据（危险操作）
                                </span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={restoreOptions.skipDuplicates}
                                    onChange={(e) =>
                                        setRestoreOptions((prev) => ({
                                            ...prev,
                                            skipDuplicates: e.target.checked,
                                        }))
                                    }
                                />
                                <span className="text-sm">跳过重复项</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={restoreOptions.updateExisting}
                                    onChange={(e) =>
                                        setRestoreOptions((prev) => ({
                                            ...prev,
                                            updateExisting: e.target.checked,
                                        }))
                                    }
                                />
                                <span className="text-sm">
                                    更新已存在的备忘录
                                </span>
                            </label>

                            {restoreOptions.clearExisting && (
                                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <span className="text-red-800 text-sm">
                                        警告：此操作将删除所有现有备忘录！
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 恢复按钮 */}
                    {selectedFile && (
                        <div className="flex gap-2">
                            <Button
                                onClick={handleRestore}
                                disabled={isRestoring}
                                className="flex-1"
                            >
                                {isRestoring ? "正在恢复..." : "开始恢复"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={resetState}
                                disabled={isRestoring}
                            >
                                取消
                            </Button>
                        </div>
                    )}

                    {/* 恢复结果 */}
                    {restoreResult && (
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="font-medium text-green-800">
                                        恢复完成
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                                    <div>导入: {restoreResult.imported}</div>
                                    <div>跳过: {restoreResult.skipped}</div>
                                    <div>更新: {restoreResult.updated}</div>
                                </div>
                                {restoreResult.errors.length > 0 && (
                                    <div className="mt-2">
                                        <div className="text-sm font-medium text-red-700 mb-1">
                                            错误 ({restoreResult.errors.length}
                                            ):
                                        </div>
                                        <div className="text-xs text-red-600 max-h-32 overflow-y-auto">
                                            {restoreResult.errors.map(
                                                (error, index) => (
                                                    <div key={index}>
                                                        • {error}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
