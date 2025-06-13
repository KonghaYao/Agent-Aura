import React, { useRef, useState } from "react";

export interface FileUploaderInterface {
    uploadFile: (file: File) => Promise<string | null>;
    isImageOnly?: boolean;
}

interface FileDropzoneProps {
    uploader: FileUploaderInterface;
    onFileUploaded: (url: string) => void;
    children: React.ReactNode;
    overlayText?: string;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
    uploader,
    onFileUploaded,
    children,
    overlayText = "将文件拖放到此处",
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const dragCounter = useRef(0);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            setIsUploading(true);
            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (
                        uploader.isImageOnly &&
                        !file.type.startsWith("image/")
                    ) {
                        console.log(
                            "File is not an image, skipping upload:",
                            file.name,
                        );
                        continue;
                    }

                    const url = await uploader.uploadFile(file);
                    if (url) {
                        onFileUploaded(url);
                    }
                }
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <div
            className="relative w-full h-full"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="absolute inset-0 bg-blue-500/20 z-50 flex items-center justify-center border-4 border-dashed border-blue-300 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                        {overlayText}
                    </div>
                </div>
            )}
            {children}
        </div>
    );
};

export default FileDropzone;
