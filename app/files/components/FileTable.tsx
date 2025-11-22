import React from "react";
import type { File } from "../types";

// 自定义 saveAs 函数，用于下载文件
const saveAs = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Trash2,
    Download,
    Eye,
    FileText,
    Image as ImageIcon,
    Film,
    Table as TableIcon,
    Code,
    Presentation,
    File as FileDefaultIcon,
} from "lucide-react";
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

interface FileTableProps {
    files: File[];
    onDelete: (id: number) => void;
    onPreview: (file: File | null) => void;
    previewFile: File | null;
}

const FileTable: React.FC<FileTableProps> = ({
    files,
    onDelete,
    onPreview,
    previewFile,
}) => {
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getFileIcon = (category: string | null) => {
        const baseClass = "h-4 w-4 shrink-0";
        switch (category) {
            case "document":
                return <FileText className={cn(baseClass, "text-blue-500")} />;
            case "image":
                return (
                    <ImageIcon className={cn(baseClass, "text-purple-500")} />
                );
            case "audio-video":
                return <Film className={cn(baseClass, "text-pink-500")} />;
            case "table":
                return (
                    <TableIcon className={cn(baseClass, "text-green-500")} />
                );
            case "code":
                return <Code className={cn(baseClass, "text-orange-500")} />;
            case "presentation":
                return (
                    <Presentation
                        className={cn(baseClass, "text-yellow-500")}
                    />
                );
            default:
                return (
                    <FileDefaultIcon
                        className={cn(baseClass, "text-gray-500")}
                    />
                );
        }
    };

    return (
        <div className="rounded-md overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-[40%]">文件名</TableHead>
                        <TableHead className="w-[15%]">类型</TableHead>
                        <TableHead className="w-[15%]">大小</TableHead>
                        <TableHead className="w-[20%]">更新时间</TableHead>
                        <TableHead className="w-[10%] text-right">
                            操作
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {files.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                暂无文件
                            </TableCell>
                        </TableRow>
                    ) : (
                        files.map((file) => (
                            <TableRow
                                key={file.id}
                                className={cn(
                                    "cursor-pointer transition-colors hover:bg-muted/50",
                                    previewFile?.id === file.id && "bg-muted",
                                )}
                                onClick={() => {
                                    if (
                                        file.category === "document" ||
                                        file.category === "code" ||
                                        file.category === "image" ||
                                        file.category === "table"
                                    ) {
                                        onPreview(file);
                                    }
                                }}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex items-center space-x-2 max-w-md">
                                        {getFileIcon(file.category)}
                                        <span
                                            className="truncate"
                                            title={file.file_name}
                                        >
                                            {file.file_name}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {file.category || "未知"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatFileSize(file.file_size)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(file.update_time)}
                                </TableCell>
                                <TableCell
                                    className="text-right"
                                    onClick={(e: React.MouseEvent) =>
                                        e.stopPropagation()
                                    }
                                >
                                    <div className="flex justify-end gap-1">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() =>
                                                            onPreview(file)
                                                        }
                                                        disabled={
                                                            ![
                                                                "document",
                                                                "code",
                                                                "image",
                                                                "table",
                                                            ].includes(
                                                                file.category ||
                                                                    "",
                                                            )
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4 text-blue-500" />
                                                        <span className="sr-only">
                                                            预览
                                                        </span>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    预览
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() =>
                                                            saveAs(
                                                                file.oss_url,
                                                                file.file_name,
                                                            )
                                                        }
                                                    >
                                                        <Download className="h-4 w-4 text-green-500" />
                                                        <span className="sr-only">
                                                            下载
                                                        </span>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    下载
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                    <span className="sr-only">
                                                        删除
                                                    </span>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        确定要删除吗？
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        此操作无法撤销。这将从服务器永久删除文件。
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>
                                                        取消
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-red-600 hover:bg-red-700"
                                                        onClick={() =>
                                                            onDelete(file.id)
                                                        }
                                                    >
                                                        删除
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default FileTable;
