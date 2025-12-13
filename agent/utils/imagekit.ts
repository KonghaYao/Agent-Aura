import ImageKit from "imagekit";
import { getEnv } from "./getEnv";

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
    } = {}
): Promise<string> {
    const {
        folder = "/uploads",
        tags = [],
        useUniqueFileName = true,
    } = options;

    let fileData: string;

    if (Buffer.isBuffer(file)) {
        fileData = file.toString("base64");
    } else {
        fileData = file;
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

    return result.url;
}
