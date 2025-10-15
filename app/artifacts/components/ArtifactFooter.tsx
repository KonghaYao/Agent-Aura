import { useState } from "react";
import { GitBranchPlus, Copy, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useArtifacts } from "../ArtifactsContext";

interface ArtifactFooterProps {}

export const ArtifactFooter: React.FC<ArtifactFooterProps> = () => {
    const [isCopied, setIsCopied] = useState(false);
    const { currentArtifact, artifacts, setCurrentArtifactById } =
        useArtifacts();

    // 如果没有当前 artifact，不渲染
    if (!currentArtifact) {
        return null;
    }

    // 获取当前 artifact 的所有版本
    const currentComposedArtifact = artifacts.find(
        (a) => a.id === currentArtifact.id,
    );

    const handleCopyCode = async () => {
        if (currentArtifact?.code) {
            try {
                await navigator.clipboard.writeText(currentArtifact.code);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (err) {
                console.error("无法复制代码:", err);
            }
        }
    };

    const handleDownloadCode = () => {
        if (currentArtifact?.code) {
            const blob = new Blob([currentArtifact.code], {
                type: "text/plain",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = currentArtifact.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="border-t p-2 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
                <GitBranchPlus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">版本:</span>
                <Select
                    value={currentArtifact?.version.toString()}
                    onValueChange={(value) => {
                        const selectedVersion =
                            currentComposedArtifact?.versions.find(
                                (v) => v.version === parseInt(value),
                            );
                        if (selectedVersion) {
                            setCurrentArtifactById(
                                selectedVersion.id,
                                selectedVersion.tool_id,
                            );
                        }
                    }}
                >
                    <SelectTrigger className="w-[100px] h-8">
                        <SelectValue placeholder="选择版本" />
                    </SelectTrigger>
                    <SelectContent>
                        {currentComposedArtifact?.versions.map((version) => (
                            <SelectItem
                                key={version.id}
                                value={version.version.toString()}
                            >
                                v{version.version}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground mr-2">
                    {currentArtifact?.filetype?.toUpperCase()}
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleCopyCode}
                            >
                                {isCopied ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>复制源代码</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleDownloadCode}
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>下载源代码</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};
