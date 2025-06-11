import { useEffect, useRef, useState } from "react";
import { wrap, windowEndpoint } from "comlink";
import { useArtifacts } from "./ArtifactsContext";
import { SourceCodeViewer } from "./SourceCodeViewer";
import {
    ChevronDown,
    RefreshCw,
    GitBranchPlus,
    Copy,
    Download,
    CheckCircle2,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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

type ViewMode = "preview" | "source";

export const ArtifactViewer: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
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
    const [isFileSelectOpen, setIsFileSelectOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const getIframeAPI = async (iframe: HTMLIFrameElement) => {
        const iframeApi = wrap(windowEndpoint(iframe.contentWindow!));

        // 5 秒内，每 50 ms 检测一次 init 函数
        const index = await Promise.race(
            Array(100)
                .fill(0)
                .map((_, index) => {
                    return new Promise((resolve) => {
                        setTimeout(async () => {
                            /* @ts-ignore */
                            if (await iframeApi.init()) {
                                resolve(index);
                            }
                        }, 100 * index);
                    });
                })
        );

        return iframeApi;
    };

    const runCode = async () => {
        console.log(iframeKey);
        if (!iframeRef.current) return;

        setIsLoading(true);
        try {
            const iframeApi: any = await getIframeAPI(iframeRef.current);
            await iframeApi.run(
                currentArtifact?.code,
                currentArtifact?.filename,
                currentArtifact?.filetype
            );
        } catch (error) {
            console.error("Failed to run code:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const refresh = () => {
        setIframeKey((prev) => prev + 1);
    };

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

    useEffect(() => {
        if (currentArtifact && iframeRef.current) {
            setIframeKey((prev) => prev + 1);
        }
    }, [currentArtifact?.id]);

    useEffect(() => {
        if (iframeRef.current) {
            runCode();
        }
    }, [iframeKey]);

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
        new Set(artifacts.map((a) => a.filename))
    );

    return (
        <div className="h-full w-full flex flex-col border rounded-2xl bg-white">
            <div className="flex items-center justify-between p-2 border-b">
                <div className="flex items-center space-x-4 flex-wrap">
                    <Popover
                        open={isFileSelectOpen}
                        onOpenChange={setIsFileSelectOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex items-center justify-between gap-2 border-none">
                                <span className="truncate max-w-[200px]">
                                    {currentArtifact.filename}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <div className="max-h-[300px] overflow-auto">
                                {uniqueFilenames.map((filename) => {
                                    const fileVersions =
                                        getArtifactVersions(filename);
                                    const latestVersion =
                                        fileVersions[fileVersions.length - 1];
                                    return (
                                        <Button
                                            key={filename}
                                            variant="ghost"
                                            className="w-full justify-start text-left px-3 py-2 rounded-none"
                                            onClick={() => {
                                                setCurrentArtifactById(
                                                    latestVersion.id
                                                );
                                                setIsFileSelectOpen(false);
                                            }}>
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
                        className="ml-auto border-none">
                        <RefreshCw
                            className={`h-4 w-4 ${
                                isLoading ? "animate-spin" : ""
                            }`}
                        />
                        <span className="sr-only">刷新</span>
                    </Button>
                )}
                <Tabs
                    defaultValue={viewMode}
                    value={viewMode}
                    onValueChange={(value) => {
                        setViewMode(value as ViewMode);
                        if (value === "preview") refresh();
                    }}
                    className="w-auto">
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
                        }}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                {viewMode === "preview" ? (
                    <iframe
                        key={iframeKey}
                        ref={iframeRef}
                        src="https://langgraph-artifacts.netlify.app/index.html"
                        className="w-full h-full border-none"
                    />
                ) : (
                    <SourceCodeViewer />
                )}
            </div>
            <div className="border-t p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <GitBranchPlus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">版本:</span>
                    <Select
                        value={currentArtifact.id}
                        onValueChange={(value) =>
                            setCurrentArtifactById(value)
                        }>
                        <SelectTrigger className="w-[100px] h-8">
                            <SelectValue placeholder="选择版本" />
                        </SelectTrigger>
                        <SelectContent>
                            {versions.map((version) => (
                                <SelectItem key={version.id} value={version.id}>
                                    v{version.version}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground mr-2">
                        {currentArtifact.filetype.toUpperCase()}
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleCopyCode}>
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
                                    onClick={handleDownloadCode}>
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
        </div>
    );
};
