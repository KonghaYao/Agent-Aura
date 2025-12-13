import ImageKit from "imagekit";
import { getEnv } from "./getEnv";
import { fileStoreService, type FileInsert } from "../filestore";

// 统一的 ImageKit 实例
export const imagekit = new ImageKit({
    publicKey: getEnv("IMAGEKIT_PUBLIC_KEY") || "",
    privateKey: getEnv("IMAGEKIT_PRIVATE_KEY") || "",
    urlEndpoint: getEnv("IMAGEKIT_URL_ENDPOINT") || "",
});

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

    const result = await imagekit.upload({
        file: fileData,
        fileName: fileName,
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
