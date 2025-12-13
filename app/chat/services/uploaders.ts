import type { FileUploaderInterface } from "../components/FileDropzone";

// ImageKit 上传器
export class ImageKitUploader implements FileUploaderInterface {
    isImageOnly = false; // ImageKit 支持多种文件类型
    async uploadFile(file: File): Promise<string | null> {
        try {
            // 将文件转换为 base64
            const base64Data = await this.fileToBase64(file);

            // 调用服务端 ImageKit 上传 API
            const response = await fetch("/api/files/upload/imagekit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileData: base64Data,
                    folder: "/chat-uploads", // 可选：指定上传文件夹
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // 返回 ImageKit 的文件 URL
                if (data?.data?.image_url) {
                    return data.data.image_url;
                }
                console.error(
                    "Invalid response format from ImageKit upload API",
                );
                return null;
            } else {
                const errorData = await response.json();
                console.error("ImageKit upload failed:", errorData.error);
                return null;
            }
        } catch (error) {
            console.error("Error uploading file to ImageKit:", error);
            return null;
        }
    }

    private async fileToBase64(file: File): Promise<string> {
        // 兼容全环境的文件转base64方法
        if (typeof file.arrayBuffer === "function") {
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            // 优先使用 btoa（浏览器），否则使用 Buffer（Node.js/Bun）
            return typeof btoa !== "undefined"
                ? btoa(binary)
                : Buffer.from(binary, "binary").toString("base64");
        }

        // 浏览器环境回退方案
        if (typeof FileReader !== "undefined") {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(",")[1]); // 移除 data URL 前缀
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        throw new Error("File reading not supported in this environment");
    }
}

// 可以添加其他上传实现，例如：
// export class S3Uploader implements FileUploaderInterface { ... }
// export class CustomApiUploader implements FileUploaderInterface { ... }

export const defaultUploader = new ImageKitUploader();
