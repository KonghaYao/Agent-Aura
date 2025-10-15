import { useState } from "react";
import { ChevronDown, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useArtifacts } from "../ArtifactsContext";

interface ArtifactHeaderProps {
    viewMode: "preview" | "source";
    setViewMode: (mode: "preview" | "source") => void;
    refresh: () => void;
    isLoading: boolean;
}

export const ArtifactHeader: React.FC<ArtifactHeaderProps> = ({
    viewMode,
    setViewMode,
    refresh,
    isLoading,
}) => {
    const [isFileSelectOpen, setIsFileSelectOpen] = useState(false);
    const {
        currentArtifact,
        artifacts,
        setCurrentArtifactById,
        setShowArtifact,
    } = useArtifacts();

    // 如果没有当前 artifact，不渲染
    if (!currentArtifact) {
        return null;
    }

    // 获取所有唯一的文件名
    const uniqueFilenames = Array.from(
        new Set(artifacts.map((a) => a.filename)),
    );

    return (
        <div className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center space-x-4 flex-wrap">
                <Popover
                    open={isFileSelectOpen}
                    onOpenChange={setIsFileSelectOpen}
                >
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="flex items-center justify-between gap-2 border-none"
                        >
                            <span className="truncate max-w-[200px]">
                                {currentArtifact?.filename}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                        <div className="max-h-[300px] overflow-auto">
                            {uniqueFilenames.map((filename) => {
                                const composedArtifact = artifacts.find(
                                    (a) => a.filename === filename,
                                );
                                const latestVersion =
                                    composedArtifact?.versions[
                                        composedArtifact.versions.length - 1
                                    ];
                                return (
                                    <Button
                                        key={filename}
                                        variant="ghost"
                                        className="w-full justify-start text-left px-3 py-2 rounded-none"
                                        onClick={() => {
                                            if (
                                                composedArtifact &&
                                                latestVersion
                                            ) {
                                                setCurrentArtifactById(
                                                    latestVersion.id,
                                                    latestVersion.tool_id,
                                                );
                                            }
                                            setIsFileSelectOpen(false);
                                        }}
                                    >
                                        {filename}
                                    </Button>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            {viewMode === "preview" && (
                <Button
                    size="icon"
                    variant="outline"
                    onClick={refresh}
                    disabled={isLoading}
                    className="ml-auto border-none"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    <span className="sr-only">刷新</span>
                </Button>
            )}
            <Tabs
                defaultValue={viewMode}
                value={viewMode}
                onValueChange={(value) => {
                    setViewMode(value as "preview" | "source");
                    if (value === "preview") refresh();
                }}
                className="w-auto"
            >
                <TabsList>
                    <TabsTrigger value="preview">预览</TabsTrigger>
                    <TabsTrigger value="source">源代码</TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="border-none"
                    onClick={() => {
                        setShowArtifact(false);
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
