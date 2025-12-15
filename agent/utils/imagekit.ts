import { getEnv } from "./getEnv";
import { fileStoreService, type FileInsert } from "../filestore";

// 手写 fetch 上传到 ImageKit
async function uploadToImageKitAPI(
    file: string | Buffer,
    fileName: string,
    options: {
        folder?: string;
        tags?: string[];
        useUniqueFileName?: boolean;
    } = {},
): Promise<any> {
    const url = "https://upload.imagekit.io/v1/files/upload";
    const form = new FormData();

    // 处理文件数据
    if (Buffer.isBuffer(file)) {
        form.append("file", new Blob([file as unknown as BlobPart]), fileName);
    } else {
        // base64 字符串
        const blob = Buffer.from(file, "base64");
        form.append("file", new Blob([blob]), fileName);
    }

    form.append("fileName", fileName);
    form.append("useUniqueFileName", String(options.useUniqueFileName ?? true));
    if (options.tags && options.tags.length > 0) {
        form.append("tags", options.tags.join(","));
    }
    if (options.folder) {
        form.append("folder", options.folder);
    }

    // 创建 Basic Auth token (注意末尾的冒号)
    const privateKey = getEnv("IMAGEKIT_PRIVATE_KEY") || "";
    const authToken = btoa(`${privateKey}:`);

    const requestOptions = {
        method: "POST",
        headers: {
            Accept: "application/json",
            Authorization: `Basic ${authToken}`,
            // 移除手动设置的 Content-Type，让 fetch 自动处理 multipart/form-data
        },
        body: form,
    };

    try {
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            throw new Error(
                `ImageKit upload failed: ${response.status} ${
                    response.statusText
                } ${await response.text()}`,
            );
        }
        const data = await response.json();

        return data;
    } catch (error) {
        console.error("ImageKit upload error:", error);
        throw error;
    }
}

// 统一的上传函数
export async function uploadToImageKit(
    file: string | Buffer,
    fileName: string,
    options: {
        folder?: string;
        tags?: string[];
        useUniqueFileName?: boolean;
        // 数据库相关选项
        saveToDb?: boolean;
        dbOptions?: {
            userId: string;
            conversationId?: string | null;
            category?: string;
            isAiGen?: boolean;
            customTags?: string[]; // 额外的自定义标签
        };
    } = {},
): Promise<{ url: string; file?: any }> {
    const {
        folder = "/uploads",
        tags = [],
        useUniqueFileName = true,
        saveToDb = false,
        dbOptions,
    } = options;

    let fileData: string;
    let fileSize: number;
    let fileType: string = "unknown";

    if (Buffer.isBuffer(file)) {
        fileData = file.toString("base64");
        fileSize = file.length;
    } else {
        // base64 字符串的情况
        fileData = file;
        fileSize = Math.ceil((file.length * 3) / 4); // 估算解码后的大小
    }

    // 尝试根据文件名推断文件类型
    const ext = fileName.split(".").pop()?.toLowerCase();
    let category = "document";
    if (ext) {
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
            fileType = `image/${ext === "jpg" ? "jpeg" : ext}`;
            category = "image";
        } else if (["mp4", "avi", "mov", "webm"].includes(ext)) {
            fileType = `video/${ext}`;
            category = "audio-video";
        } else if (["pdf"].includes(ext)) {
            fileType = "application/pdf";
        } else {
            fileType = `application/${ext}`;
        }
    }

    const result = await uploadToImageKitAPI(file, fileName, {
        folder: folder,
        useUniqueFileName: useUniqueFileName,
        tags: tags,
    });

    if (!result || !result.url) {
        throw new Error("ImageKit 上传失败");
    }

    let savedFile;
    if (saveToDb && dbOptions) {
        const fileDataToSave: FileInsert = {
            user_id: dbOptions.userId,
            conversation_id: dbOptions.conversationId || null,
            file_name: result.name || fileName,
            file_size: result.size || fileSize,
            file_type: result.fileType || fileType,
            oss_url: result.url,
            category,
            tags: tags,
            is_ai_gen: dbOptions.isAiGen || false,
        };

        savedFile = await fileStoreService.createFile(fileDataToSave);
    }

    return {
        url: result.url,
        file: savedFile,
    };
}
