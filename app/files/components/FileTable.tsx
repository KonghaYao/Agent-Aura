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

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50%]">文件名</TableHead>
                        <TableHead className="w-[15%]">大小</TableHead>
                        <TableHead className="w-[20%]">更新时间</TableHead>
                        <TableHead className="w-[15%]">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {files.map((file) => (
                        <TableRow key={file.id}>
                            <TableCell className="font-medium max-w-0">
                                <div
                                    className="truncate"
                                    title={file.file_name}
                                >
                                    {file.file_name}
                                </div>
                            </TableCell>
                            <TableCell>
                                {formatFileSize(file.file_size)}
                            </TableCell>
                            <TableCell>
                                {formatDate(file.update_time)}
                            </TableCell>
                            <TableCell>
                                <div className="flex space-x-2">
                                    {file.category === "document" && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="预览"
                                            onClick={() =>
                                                onPreview(
                                                    previewFile?.id === file.id
                                                        ? null
                                                        : file,
                                                )
                                            }
                                            className={
                                                previewFile?.id === file.id
                                                    ? "bg-blue-100"
                                                    : ""
                                            }
                                        >
                                            <Eye className="h-4 w-4 text-blue-500" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            saveAs(file.oss_url, file.file_name)
                                        }
                                    >
                                        <Download className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4 text-red-500" />
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
                    ))}
                </TableBody>
            </Table>
        </>
    );
};

export default FileTable;
