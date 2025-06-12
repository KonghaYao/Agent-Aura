import { useState } from "react";
import { Artifact } from "../types";
import { IframePreview } from "./IframePreview";
import { SourceCodeViewer } from "../SourceCodeViewer";
import { PreviewType, getPreviewConfig } from "../config/previewConfig";
import { MarkdownRenderer } from "../../components/shared/MarkdownRenderer";

interface ArtifactPreviewProps {
    currentArtifact: Artifact | null;
    iframeKey: number;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({
    currentArtifact,
    iframeKey,
    isLoading,
    setIsLoading,
}) => {
    if (!currentArtifact) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                请选择一个文件
            </div>
        );
    }

    // 获取预览配置
    const previewConfig = getPreviewConfig(currentArtifact.filetype);

    // 根据预览类型选择不同的渲染方式
    switch (previewConfig.type) {
        case PreviewType.IFRAME:
            return (
                <IframePreview
                    currentArtifact={currentArtifact}
                    iframeKey={iframeKey}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                />
            );
        
        case PreviewType.MARKDOWN:
            return (
                <div className="h-full w-full overflow-auto p-6">
                    <MarkdownRenderer content={currentArtifact.code} />
                </div>
            );
            
        case PreviewType.CODE:
            return (
                <div className="h-full w-full overflow-auto">
                    <div className="p-4">
                        <SourceCodeViewer />
                    </div>
                </div>
            );
        
        case PreviewType.NONE:
        default:
            return (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    该文件类型不支持预览
                </div>
            );
    }
};
