import React from "react";
import type { File } from "../types";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Eye } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
    files: File[];
    onDelete: (id: number) => void;
    onPreview: (file: File | null) => void;
    previewFile: File | null;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
    files,
    onDelete,
    onPreview,
    previewFile,
}) => {
    const saveAs = (url: string, filename: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    if (files.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">暂无图片</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {files.map((file) => (
                <div
                    key={file.id}
                    className={cn(
                        "group relative rounded-lg overflow-hidden border bg-card transition-all hover:shadow-md cursor-pointer",
                        previewFile?.id === file.id && "ring-2 ring-primary",
                    )}
                    onClick={() => onPreview(file)}
                >
                    {/* 图片容器 */}
                    <div className="aspect-square relative overflow-hidden bg-muted/30">
                        <img
                            src={file.oss_url}
                            alt={file.file_name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                        />

                        {/* 操作按钮覆盖层 */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8 bg-white/90 hover:bg-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPreview(file);
                                                }}
                                            >
                                                <Eye className="h-4 w-4 text-gray-700" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>预览</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8 bg-white/90 hover:bg-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    saveAs(
                                                        file.oss_url,
                                                        file.file_name,
                                                    );
                                                }}
                                            >
                                                <Download className="h-4 w-4 text-gray-700" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>下载</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 bg-white/90 hover:bg-white"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                确定要删除吗？
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                此操作无法撤销。这将从服务器永久删除文件
                                                "{file.file_name}"。
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                取消
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-red-600 hover:bg-red-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(file.id);
                                                }}
                                            >
                                                删除
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </div>

                    {/* 文件信息 */}
                    <div className="p-2 bg-background/95">
                        <div className="flex flex-col gap-1">
                            <p
                                className="text-sm font-medium truncate"
                                title={file.file_name}
                            >
                                {file.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.file_size)}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ImageGallery;
