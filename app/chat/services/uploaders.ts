import type { FileUploaderInterface } from "../components/FileDropzone";

export class TempFilesUploader implements FileUploaderInterface {
    isImageOnly = true;

    async uploadFile(file: File): Promise<string | null> {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("https://tmpfiles.org/api/v1/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                // tmpfiles.org API返回格式: { "data": { "url": "https://tmpfiles.org/xxxx" } }
                if (data && data.data && data.data.url) {
                    return data.data.url.replace(
                        "tmpfiles.org/",
                        "tmpfiles.org/dl/",
                    );
                }
                console.error("Invalid response format from tmpfiles.org");
                return null;
            } else {
                console.error("File upload failed");
                return null;
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            return null;
        }
    }
}

// 可以添加其他上传实现，例如：
// export class S3Uploader implements FileUploaderInterface { ... }
// export class CustomApiUploader implements FileUploaderInterface { ... }

export const defaultUploader = new TempFilesUploader();
