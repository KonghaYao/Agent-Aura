import React, { useState, useEffect } from "react";
import { Response } from "@/components/ai-elements/response";
import { Loader2 } from "lucide-react";
import type { File } from "../types";

interface FilePreviewContentProps {
    file: File;
}

const FilePreviewContent: React.FC<FilePreviewContentProps> = ({ file }) => {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (file) {
            fetchFileContent(file);
        }
    }, [file]);

    const fetchFileContent = async (file: File) => {
        setLoading(true);
        setError(null);
        setContent("");

        try {
            // 检查文件大小（限制为 5MB）
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.file_size > maxSize) {
                throw new Error(
                    `文件过大 (超过 ${Math.round(
                        maxSize / 1024 / 1024,
                    )}MB)，无法预览`,
                );
            }

            // 检查是否为文本文件类型
            const textTypes = [
                "text/",
                "application/json",
                "application/xml",
                "application/javascript",
                "application/typescript",
                "application/markdown",
            ];

            const isTextFile = textTypes.some(
                (type) =>
                    file.file_type.startsWith(type) ||
                    file.file_name.toLowerCase().endsWith(".md") ||
                    file.file_name.toLowerCase().endsWith(".txt") ||
                    file.file_name.toLowerCase().endsWith(".json") ||
                    file.file_name.toLowerCase().endsWith(".xml") ||
                    file.file_name.toLowerCase().endsWith(".js") ||
                    file.file_name.toLowerCase().endsWith(".ts") ||
                    file.file_name.toLowerCase().endsWith(".tsx") ||
                    file.file_name.toLowerCase().endsWith(".jsx") ||
                    file.file_name.toLowerCase().endsWith(".html") ||
                    file.file_name.toLowerCase().endsWith(".css"),
            );

            if (!isTextFile) {
                throw new Error("此文件类型不支持预览");
            }

            // 获取文件内容
            const url =
                import.meta.env.NODE_ENV === "production"
                    ? file.oss_url
                    : file.oss_url.replace("https://agent-aura.top", "");

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`无法获取文件内容 (${response.status})`);
            }

            const text = await response.text();

            // 对于纯文本文件，直接使用内容
            // 对于 markdown 文件，也直接使用内容（Response 组件会处理 markdown 渲染）
            setContent(text);
        } catch (err: any) {
            setError(err.message || "无法加载文件内容");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>加载中...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                <span>错误: {error}</span>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <span>无法预览此文件类型</span>
            </div>
        );
    }

    return (
        <div className="h-full">
            <Response className="prose prose-sm max-w-none">{content}</Response>
        </div>
    );
};

export default FilePreviewContent;
