import React, { useState, useEffect, useCallback } from "react";
import type { File } from "./types";
import FileTable from "./components/FileTable";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { FileService } from "./services/FileService";
import { TmpFilesClient } from "../chat/FileUpload/index";

const FilesPage: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("all");

    const fileService = FileService.getInstance(new TmpFilesClient());

    const fetchFiles = useCallback(
        async (category: string = "all") => {
            setLoading(true);
            setError(null);
            try {
                const files = await fileService.getFiles(category);
                setFiles(files);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        },
        [fileService],
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
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await fileService.deleteFile(id);
            setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
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
            <div className="flex space-x-4 mb-4">
                <button
                    className={`px-3 py-1 text-sm rounded-md ${
                        activeCategory === "all" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setActiveCategory("all")}
                >
                    全部
                </button>
                <button
                    className={`px-3 py-1 text-sm rounded-md ${
                        activeCategory === "document" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setActiveCategory("document")}
                >
                    文档
                </button>
                <button
                    className={`px-3 py-1 text-sm rounded-md ${
                        activeCategory === "image" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setActiveCategory("image")}
                >
                    图片
                </button>
                <button
                    className={`px-3 py-1 text-sm rounded-md ${
                        activeCategory === "audio-video" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setActiveCategory("audio-video")}
                >
                    音视频
                </button>
                <button
                    className={`px-3 py-1 text-sm rounded-md ${
                        activeCategory === "table" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setActiveCategory("table")}
                >
                    表格
                </button>
                <button
                    className={`px-3 py-1 text-sm rounded-md ${
                        activeCategory === "code" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setActiveCategory("code")}
                >
                    编程应用
                </button>
                <button
                    className={`px-3 py-1 text-sm rounded-md ${
                        activeCategory === "presentation" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setActiveCategory("presentation")}
                >
                    PPT
                </button>
            </div>

            {uploadProgress !== null && (
                <div className="mb-4">
                    <p>上传中... {uploadProgress}%</p>
                    <Progress value={uploadProgress} className="w-full" />
                </div>
            )}

            {loading && <p>Loading files...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && (
                <FileTable files={files} onDelete={handleDelete} />
            )}
        </div>
    );
};

export default FilesPage;
