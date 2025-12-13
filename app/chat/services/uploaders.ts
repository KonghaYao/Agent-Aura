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
                if (data.data && data.data.imagekit && data.data.imagekit.url) {
                    return data.data.imagekit.url;
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

    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // 移除 data:*/*;base64, 前缀，只保留 base64 数据
                const base64Data = result.split(",")[1];
                resolve(base64Data);
            };
            reader.onerror = (error) => reject(error);
        });
    }
}

// 可以添加其他上传实现，例如：
// export class S3Uploader implements FileUploaderInterface { ... }
// export class CustomApiUploader implements FileUploaderInterface { ... }

export const defaultUploader = new ImageKitUploader();
