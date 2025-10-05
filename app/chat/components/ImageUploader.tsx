import React from "react";
import { defaultUploader } from "../services/uploaders";

interface ImageUploaderProps {
    imageUrls: string[];
    onAddImage: (url: string) => void;
    onRemoveImage: (index: number) => void;
    maxImages?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
    imageUrls,
    onAddImage,
    onRemoveImage,
    maxImages = 3,
}) => {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const imageFiles = selectedFiles.filter((file) =>
            file.type.startsWith("image/"),
        );

        // 检查是否超过最大数量限制
        if (imageUrls.length + imageFiles.length > maxImages) {
            alert(`最多只能上传${maxImages}张图片`);
            e.target.value = "";
            return;
        }

        for (const file of imageFiles) {
            const url = await defaultUploader.uploadFile(file);
            if (url) {
                onAddImage(url);
            }
        }

        e.target.value = "";
    };

    // 渲染上传按钮
    const renderUploadButton = (size: "small" | "large" = "large") => {
        const isSmall = size === "small";

        return (
            <label
                className={`inline-flex items-center justify-center ${
                    isSmall ? "w-8 h-8 rounded-full" : "w-20 h-20 rounded-lg"
                } text-gray-500 bg-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-200`}
            >
                <svg
                    viewBox="0 0 24 24"
                    width={isSmall ? "16" : "32"}
                    height={isSmall ? "16" : "32"}
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
        );
    };

    if (imageUrls.length === 0) {
        return renderUploadButton("small");
    }

    return (
        <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200">
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
                        onClick={() => onRemoveImage(index)}
                    >
                        ×
                    </button>
                </div>
            ))}
            {imageUrls.length < maxImages && renderUploadButton()}
        </div>
    );
};

export default ImageUploader;
