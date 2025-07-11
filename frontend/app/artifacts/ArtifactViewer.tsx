import { useEffect, useState } from "react";
import { useArtifacts } from "./ArtifactsContext";
import { SourceCodeViewer } from "./SourceCodeViewer";
import { ArtifactHeader, ArtifactPreview, ArtifactFooter } from "./components";
import { ViewMode } from "./types";

export const ArtifactViewer: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const {
        currentArtifact,
        getArtifactVersions,
        setCurrentArtifactById,
        artifacts,
        setShowArtifact,
    } = useArtifacts();
    const [iframeKey, setIframeKey] = useState(0);
    const [viewMode, setViewMode] = useState<ViewMode>("preview");

    const refresh = () => {
        setIframeKey((prev) => prev + 1);
    };

    useEffect(() => {
        if (currentArtifact) {
            setIframeKey((prev) => prev + 1);
        }
    }, [currentArtifact?.id]);

    if (!currentArtifact) {
        return (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                请选择一个文件
            </div>
        );
    }

    const versions = getArtifactVersions(currentArtifact.filename);

    // 获取所有唯一的文件名
    const uniqueFilenames = Array.from(
        new Set(artifacts.map((a) => a.filename)),
    );

    return (
        <div className="h-full w-full flex flex-col border rounded-2xl bg-white">
            <ArtifactHeader
                currentArtifact={currentArtifact}
                viewMode={viewMode}
                setViewMode={setViewMode}
                uniqueFilenames={uniqueFilenames}
                getArtifactVersions={getArtifactVersions}
                setCurrentArtifactById={setCurrentArtifactById}
                setShowArtifact={setShowArtifact}
                refresh={refresh}
                isLoading={isLoading}
            />

            <div className="flex-1 overflow-hidden relative">
                {viewMode === "preview" && !currentArtifact.isLoading ? (
                    <ArtifactPreview
                        key={currentArtifact.code}
                        currentArtifact={currentArtifact}
                        iframeKey={iframeKey}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                    />
                ) : (
                    <SourceCodeViewer />
                )}
            </div>

            <ArtifactFooter
                currentArtifact={currentArtifact}
                versions={versions}
                setCurrentArtifactById={setCurrentArtifactById}
            />
        </div>
    );
};
