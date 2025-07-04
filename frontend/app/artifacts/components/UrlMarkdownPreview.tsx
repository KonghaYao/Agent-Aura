import { useState, useEffect } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "../../components/shared/MarkdownRenderer";
import { Artifact } from "../ArtifactsContext";
interface UrlMarkdownPreviewProps {
    currentArtifact: Artifact;
}

export const UrlMarkdownPreview: React.FC<UrlMarkdownPreviewProps> = ({
    currentArtifact,
}) => {
    const [content, setContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUrlContent = async (url: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // 添加 CORS 代理或直接请求
            const response = await fetch("/api/crawler", {
                body: JSON.stringify({ url }),
                method: "POST",
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`,
                );
            }

            const text = await response.text();
            setContent(text);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "获取内容失败";
            setError(errorMessage);
            console.error("Failed to fetch URL content:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return url.startsWith("http://") || url.startsWith("https://");
        } catch {
            return false;
        }
    };

    const handleRetry = () => {
        const url = currentArtifact.code.trim();
        if (isValidUrl(url)) {
            fetchUrlContent(url);
        }
    };

    useEffect(() => {
        if (currentArtifact?.code) {
            const url = currentArtifact.code.trim();
            if (isValidUrl(url)) {
                fetchUrlContent(url);
            } else {
                setError("无效的 URL 格式，请提供有效的 HTTP/HTTPS URL");
            }
        }
    }, [currentArtifact?.code]);

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">
                        正在获取内容...
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {currentArtifact.code}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <div>
                        <p className="text-sm font-medium mb-1">获取内容失败</p>
                        <p className="text-xs text-muted-foreground">{error}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        <p className="font-medium">URL:</p>
                        <p className="break-all">{currentArtifact.code}</p>
                    </div>
                    {isValidUrl(currentArtifact.code.trim()) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRetry}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            重试
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">内容为空</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-auto p-6">
            <MarkdownRenderer content={content} />
        </div>
    );
};
