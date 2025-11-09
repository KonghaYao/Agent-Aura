import type { File as UploadFileType } from "../types";
import { FileUploadClient, TmpFilesClient } from "../../chat/FileUpload/index";

export type FileCategory =
    | "document"
    | "image"
    | "audio-video"
    | "table"
    | "code"
    | "presentation"
    | null;

/**
 * 文件服务类 - 管理与后端文件的交互
 */
export class FileService {
    private static instance: FileService | null = null;
    private uploadClient: FileUploadClient;

    private constructor(uploadClient: FileUploadClient) {
        this.uploadClient = uploadClient;
    }

    static getInstance(uploadClient?: FileUploadClient): FileService {
        if (!FileService.instance) {
            if (!uploadClient) {
                throw new Error(
                    "FileService 需要上传客户端，请传入 uploadClient 参数",
                );
            }
            FileService.instance = new FileService(uploadClient);
        }
        return FileService.instance;
    }

    /**
     * 根据文件扩展名和MIME类型识别文件类型
     */
    private detectFileCategory(file: File): FileCategory {
        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();

        // 文档类型
        if (
            fileName.endsWith(".pdf") ||
            fileName.endsWith(".doc") ||
            fileName.endsWith(".docx") ||
            fileName.endsWith(".txt") ||
            fileName.endsWith(".rtf") ||
            fileType.includes("text/") ||
            fileType.includes("application/pdf") ||
            fileType.includes("application/msword") ||
            fileType.includes("application/vnd.openxmlformats-officedocument")
        ) {
            return "document";
        }

        // 图片类型
        if (
            fileName.endsWith(".jpg") ||
            fileName.endsWith(".jpeg") ||
            fileName.endsWith(".png") ||
            fileName.endsWith(".gif") ||
            fileName.endsWith(".bmp") ||
            fileName.endsWith(".webp") ||
            fileName.endsWith(".svg") ||
            fileType.startsWith("image/")
        ) {
            return "image";
        }

        // 音视频类型
        if (
            fileName.endsWith(".mp3") ||
            fileName.endsWith(".wav") ||
            fileName.endsWith(".flac") ||
            fileName.endsWith(".aac") ||
            fileName.endsWith(".mp4") ||
            fileName.endsWith(".avi") ||
            fileName.endsWith(".mov") ||
            fileName.endsWith(".wmv") ||
            fileName.endsWith(".mkv") ||
            fileType.startsWith("audio/") ||
            fileType.startsWith("video/")
        ) {
            return "audio-video";
        }

        // 表格类型
        if (
            fileName.endsWith(".xls") ||
            fileName.endsWith(".xlsx") ||
            fileName.endsWith(".csv") ||
            fileType.includes("spreadsheet") ||
            fileType.includes("excel")
        ) {
            return "table";
        }

        // 编程应用类型
        if (
            fileName.endsWith(".js") ||
            fileName.endsWith(".ts") ||
            fileName.endsWith(".tsx") ||
            fileName.endsWith(".jsx") ||
            fileName.endsWith(".py") ||
            fileName.endsWith(".java") ||
            fileName.endsWith(".cpp") ||
            fileName.endsWith(".c") ||
            fileName.endsWith(".php") ||
            fileName.endsWith(".rb") ||
            fileName.endsWith(".go") ||
            fileName.endsWith(".rs") ||
            fileName.endsWith(".html") ||
            fileName.endsWith(".css") ||
            fileName.endsWith(".scss") ||
            fileName.endsWith(".json") ||
            fileName.endsWith(".xml") ||
            fileName.endsWith(".yaml") ||
            fileName.endsWith(".yml") ||
            fileName.endsWith(".md") ||
            fileType.includes("javascript") ||
            fileType.includes("json") ||
            fileType.includes("xml")
        ) {
            return "code";
        }

        // PPT类型
        if (
            fileName.endsWith(".ppt") ||
            fileName.endsWith(".pptx") ||
            fileName.endsWith(".pps") ||
            fileName.endsWith(".ppsx") ||
            fileType.includes("presentation") ||
            fileType.includes("powerpoint")
        ) {
            return "presentation";
        }

        return null;
    }

    /**
     * 上传文件并保存到数据库
     */
    async uploadFile(file: File): Promise<UploadFileType> {
        // 检测文件类型
        const category = this.detectFileCategory(file);

        // 使用上传客户端上传文件
        const uploadResponse = await this.uploadClient.upload(file);

        if (uploadResponse.status !== "success" || !uploadResponse.data?.url) {
            throw new Error(
                "Upload failed: Invalid response from upload service",
            );
        }

        const fileUrl = uploadResponse.data.url;

        try {
            const response = await fetch("/api/files", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    file_name: file.name,
                    file_size: file.size,
                    file_type: file.type,
                    oss_url: fileUrl,
                    category,
                    tags: ["personal"],
                    is_ai_gen: false,
                }),
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error("File upload failed:", error);
            throw error;
        }
    }

    /**
     * 获取文件列表
     */
    async getFiles(category?: string): Promise<UploadFileType[]> {
        try {
            let url = "/api/files";
            if (category && category !== "all") {
                url += `?category=${category}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Failed to fetch files");
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error("Failed to fetch files:", error);
            throw error;
        }
    }

    /**
     * 删除文件
     */
    async deleteFile(id: number): Promise<void> {
        try {
            const response = await fetch(`/api/files/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete file");
            }
        } catch (error) {
            console.error("Failed to delete file:", error);
            throw error;
        }
    }

    /**
     * 获取上传进度回调的上传方法
     */
    async uploadFileWithProgress(
        file: globalThis.File,
        onProgress?: (progress: number) => void,
    ): Promise<UploadFileType> {
        // 检测文件类型
        const category = this.detectFileCategory(file);

        // 使用上传客户端上传文件（模拟进度）
        const uploadPromise = this.uploadClient.upload(file);

        // 模拟上传进度
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 20;
            onProgress?.(Math.min(progress, 90)); // 最多到90%，等待实际完成
            if (progress >= 90) {
                clearInterval(progressInterval);
            }
        }, 200);

        let uploadResponse;
        try {
            uploadResponse = await uploadPromise;
        } finally {
            clearInterval(progressInterval);
        }

        if (uploadResponse.status !== "success" || !uploadResponse.data?.url) {
            throw new Error(
                "Upload failed: Invalid response from upload service",
            );
        }

        onProgress?.(100);
        const fileUrl = uploadResponse.data.url;

        try {
            const response = await fetch("/api/files", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    file_name: file.name,
                    file_size: file.size,
                    file_type: file.type,
                    oss_url: fileUrl,
                    category,
                    tags: ["personal"],
                    is_ai_gen: false,
                }),
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error("File upload failed:", error);
            throw error;
        }
    }
}
