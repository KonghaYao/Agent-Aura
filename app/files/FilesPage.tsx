import React, { useState, useEffect, useCallback } from "react";
import type { File } from "./types";
import FileTable from "./components/FileTable";
import ImageGallery from "./components/ImageGallery";
import FilePreviewContent from "./components/FilePreviewContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Upload,
    Search,
    Folder,
    FileText,
    Image as ImageIcon,
    Film,
    Table as TableIcon,
    Code,
    Presentation,
    LayoutGrid,
    List,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { FileService } from "./services/FileService";
import { TmpFilesClient } from "../chat/FileUpload/index";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { id: "all", label: "全部", icon: Folder },
    { id: "document", label: "文档", icon: FileText },
    { id: "image", label: "图片", icon: ImageIcon },
    { id: "audio-video", label: "音视频", icon: Film },
    { id: "table", label: "表格", icon: TableIcon },
    { id: "code", label: "编程应用", icon: Code },
    { id: "presentation", label: "PPT", icon: Presentation },
];

const FilesPage: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalFiles, setTotalFiles] = useState<number>(0);
    const pageSize = 50;

    const fileService = FileService.getInstance(new TmpFilesClient());

    const fetchFiles = useCallback(
        async (category: string = "all", page: number = 1) => {
            setLoading(true);
            setError(null);
            try {
                const result = await fileService.getFiles(
                    category,
                    page,
                    pageSize,
                );
                setFiles(result.files);
                setTotalFiles(result.total);
                setCurrentPage(page);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        },
        [fileService, pageSize],
    );

    useEffect(() => {
        fetchFiles(activeCategory);
    }, [fetchFiles, activeCategory]);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadProgress(0);

        try {
            await fileService.uploadFileWithProgress(file, (progress) => {
                setUploadProgress(progress);
            });

            fetchFiles(activeCategory); // Refresh list
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploadProgress(null);
            // Clear input
            event.target.value = "";
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await fileService.deleteFile(id);
            setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
            if (previewFile?.id === id) {
                setPreviewFile(null);
            }

            // 如果删除后当前页没有文件了，跳转到上一页
            const remainingFiles = files.filter((file) => file.id !== id);
            if (remainingFiles.length === 0 && currentPage > 1) {
                fetchFiles(activeCategory, currentPage - 1);
            } else {
                // 重新获取总数
                const result = await fileService.getFiles(
                    activeCategory,
                    currentPage,
                    pageSize,
                );
                setTotalFiles(result.total);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const filteredFiles = files.filter((file) =>
        file.file_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full bg-background">
            {/* Left Sidebar - Categories */}
            <div className="w-64 border-r bg-muted/10 p-4 flex flex-col gap-4">
                <div className="font-semibold text-lg px-2 mb-2">文件管理</div>
                <div className="flex flex-col gap-1">
                    {CATEGORIES.map((category) => (
                        <Button
                            key={category.id}
                            variant={
                                activeCategory === category.id
                                    ? "secondary"
                                    : "ghost"
                            }
                            className={cn(
                                "justify-start",
                                activeCategory === category.id &&
                                    "bg-secondary text-secondary-foreground",
                            )}
                            onClick={() => {
                                setActiveCategory(category.id);
                                setCurrentPage(1); // 切换分类时重置到第一页
                            }}
                        >
                            <category.icon className="mr-2 h-4 w-4" />
                            {category.label}
                        </Button>
                    ))}
                </div>

                <div className="mt-auto">
                    {/* Placeholder for usage stats or similar */}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-background">
                {/* Top Bar */}
                <div className="h-16 border-b flex items-center px-6 justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="搜索文件..."
                            className="pl-9 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="default"
                            onClick={() =>
                                document.getElementById("file-upload")?.click()
                            }
                        >
                            <Upload className="mr-2 h-4 w-4" /> 上传文件
                        </Button>
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleUpload}
                        />
                    </div>
                </div>

                {/* File List */}
                <div className="flex-1 px-6 overflow-auto">
                    <div className="mb-4 flex items-center justify-between sticky top-0 bg-white z-10">
                        {CATEGORIES.find((c) => c.id === activeCategory)
                            ?.label || "全部文件"}
                        <span className="text-muted-foreground text-sm font-normal ml-2">
                            ({filteredFiles.length} 个文件)
                        </span>
                        <div className="flex-1"></div>
                        {totalFiles > pageSize && (
                            <div className="flex justify-center mt-6">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => {
                                                    if (currentPage > 1) {
                                                        fetchFiles(
                                                            activeCategory,
                                                            currentPage - 1,
                                                        );
                                                    }
                                                }}
                                                className={cn(
                                                    currentPage <= 1 &&
                                                        "pointer-events-none opacity-50",
                                                )}
                                            />
                                        </PaginationItem>

                                        {/* Page numbers */}
                                        {Array.from(
                                            {
                                                length: Math.ceil(
                                                    totalFiles / pageSize,
                                                ),
                                            },
                                            (_, i) => i + 1,
                                        )
                                            .filter((page) => {
                                                const totalPages = Math.ceil(
                                                    totalFiles / pageSize,
                                                );
                                                // Show first page, last page, current page and pages around current
                                                return (
                                                    page === 1 ||
                                                    page === totalPages ||
                                                    (page >= currentPage - 1 &&
                                                        page <= currentPage + 1)
                                                );
                                            })
                                            .map((page, index, array) => {
                                                // Add ellipsis between non-consecutive pages
                                                const prevPage =
                                                    array[index - 1];
                                                const showEllipsis =
                                                    prevPage &&
                                                    page - prevPage > 1;

                                                return (
                                                    <React.Fragment key={page}>
                                                        {showEllipsis && (
                                                            <PaginationItem>
                                                                <PaginationEllipsis />
                                                            </PaginationItem>
                                                        )}
                                                        <PaginationItem>
                                                            <PaginationLink
                                                                onClick={() =>
                                                                    fetchFiles(
                                                                        activeCategory,
                                                                        page,
                                                                    )
                                                                }
                                                                isActive={
                                                                    currentPage ===
                                                                    page
                                                                }
                                                                className="cursor-pointer"
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    </React.Fragment>
                                                );
                                            })}

                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => {
                                                    const totalPages =
                                                        Math.ceil(
                                                            totalFiles /
                                                                pageSize,
                                                        );
                                                    if (
                                                        currentPage < totalPages
                                                    ) {
                                                        fetchFiles(
                                                            activeCategory,
                                                            currentPage + 1,
                                                        );
                                                    }
                                                }}
                                                className={cn(
                                                    currentPage >=
                                                        Math.ceil(
                                                            totalFiles /
                                                                pageSize,
                                                        ) &&
                                                        "pointer-events-none opacity-50",
                                                )}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </div>

                    {uploadProgress !== null && (
                        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                            <div className="flex justify-between text-sm mb-2">
                                <span>正在上传...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <Progress
                                value={uploadProgress}
                                className="w-full h-2"
                            />
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-muted-foreground">加载中...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
                            {error}
                        </div>
                    ) : activeCategory === "image" ? (
                        <ImageGallery
                            files={filteredFiles}
                            onDelete={handleDelete}
                            onPreview={setPreviewFile}
                            previewFile={previewFile}
                        />
                    ) : (
                        <div className="rounded-md border">
                            <FileTable
                                files={filteredFiles}
                                onDelete={handleDelete}
                                onPreview={setPreviewFile}
                                previewFile={previewFile}
                            />
                        </div>
                    )}

                    {/* Pagination */}
                </div>
            </div>

            {/* Preview Sheet */}
            <Sheet
                open={!!previewFile}
                onOpenChange={(open) => !open && setPreviewFile(null)}
            >
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 flex flex-col gap-0 sm:w-3/4"
                >
                    <SheetHeader className="p-6 border-b">
                        <SheetTitle className="truncate pr-8">
                            {previewFile?.file_name}
                        </SheetTitle>
                        <SheetDescription>
                            {previewFile && (
                                <span className="text-xs text-muted-foreground">
                                    {previewFile.file_size} bytes •{" "}
                                    {new Date(
                                        previewFile.update_time,
                                    ).toLocaleString()}
                                </span>
                            )}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-6">
                        {previewFile && (
                            <FilePreviewContent file={previewFile} />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default FilesPage;
