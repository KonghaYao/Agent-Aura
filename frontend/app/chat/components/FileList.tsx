"use client";

import React, { useState, useCallback } from "react";
import { TmpFilesClient } from "../FileUpload";

interface FileListProps {
    onFileUploaded: (url: string) => void;
}

const FileList: React.FC<FileListProps> = ({ onFileUploaded }) => {
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const client = new TmpFilesClient();
    const MAX_FILES = 3;

    const handleFileChange = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFiles = Array.from(event.target.files || []);
            const imageFiles = selectedFiles.filter((file) =>
                file.type.startsWith("image/"),
            );

            // 检查是否超过最大数量限制
            if (imageUrls.length + imageFiles.length > MAX_FILES) {
                alert(`最多只能上传${MAX_FILES}张图片`);
                event.target.value = "";
                return;
            }

            for (const file of imageFiles) {
                try {
                    const result = await client.upload(file);
                    if (result.data?.url) {
                        const url = result.data.url;
                        setImageUrls((prev) => [...prev, url]);
                        onFileUploaded(url);
                    }
                } catch (error) {
                    console.error("Upload failed:", error);
                }
            }

            event.target.value = "";
        },
        [onFileUploaded, imageUrls.length],
    );

    const removeImage = useCallback((index: number) => {
        setImageUrls((prev) => prev.filter((_, i) => i !== index));
    }, []);

    return (
        <div className="flex gap-2 rounded-lg flex-1">
            {imageUrls.length < MAX_FILES && (
                <label
                    className={`inline-flex items-center justify-center w-20 h-20 text-gray-500 bg-gray-100 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-200 ${
                        imageUrls.length === 0 ? "w-8 h-8" : ""
                    }`}
                >
                    <svg
                        viewBox="0 0 24 24"
                        width={imageUrls.length === 0 ? "20" : "32"}
                        height={imageUrls.length === 0 ? "20" : "32"}
                        fill="currentColor"
                    >
                        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                        <path d="M20 4h-3.17l-1.24-1.35A1.99 1.99 0 0 0 14.12 2H9.88c-.56 0-1.1.24-1.48.65L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                    </svg>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
            )}
            <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, index) => (
                    <div
                        key={index}
                        className="relative w-20 h-20 rounded-lg overflow-hidden"
                    >
                        <img
                            src={url}
                            alt={`上传图片 ${index + 1}`}
                            className="w-full h-full object-cover border border-gray-200"
                        />
                        <button
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-base leading-none hover:bg-black/70 transition-colors"
                            onClick={() => removeImage(index)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileList;
