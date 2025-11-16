import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getMimeTypeFromUrl(url: string): string {
    try {
        // 提取 URL 中的路径部分
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;

        // 获取文件扩展名
        const extension = pathname.split(".").pop()?.toLowerCase();

        if (!extension) {
            return "application/octet-stream"; // 默认二进制流
        }

        // MIME 类型映射
        const mimeTypes: Record<string, string> = {
            // 图片
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
            svg: "image/svg+xml",
            bmp: "image/bmp",
            ico: "image/x-icon",

            // 文档
            pdf: "application/pdf",
            txt: "text/plain",
            doc: "application/msword",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            xls: "application/vnd.ms-excel",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ppt: "application/vnd.ms-powerpoint",
            pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

            // 视频
            mp4: "video/mp4",
            avi: "video/x-msvideo",
            mov: "video/quicktime",
            wmv: "video/x-ms-wmv",
            flv: "video/x-flv",
            webm: "video/webm",

            // 音频
            mp3: "audio/mpeg",
            wav: "audio/wav",
            ogg: "audio/ogg",
            aac: "audio/aac",
            flac: "audio/flac",

            // 压缩文件
            zip: "application/zip",
            rar: "application/x-rar-compressed",
            "7z": "application/x-7z-compressed",
            tar: "application/x-tar",
            gz: "application/gzip",

            // 其他
            json: "application/json",
            xml: "application/xml",
            html: "text/html",
            css: "text/css",
            js: "application/javascript",
        };

        return mimeTypes[extension] || "application/octet-stream";
    } catch (error) {
        // 如果 URL 解析失败，返回默认类型
        console.warn("Invalid URL provided to getMimeTypeFromUrl:", url);
        return "application/octet-stream";
    }
}
