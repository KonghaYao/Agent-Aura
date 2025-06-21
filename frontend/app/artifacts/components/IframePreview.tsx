import { useEffect, useRef } from "react";
import { wrap, windowEndpoint } from "comlink";
import { Loader2 } from "lucide-react";
import { Artifact } from "../types";

interface IframePreviewProps {
    currentArtifact: Artifact;
    iframeKey: number;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export const IframePreview: React.FC<IframePreviewProps> = ({
    currentArtifact,
    iframeKey,
    isLoading,
    setIsLoading,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

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
                }),
        );

        return iframeApi;
    };

    const runCode = async () => {
        if (!iframeRef.current) return;

        setIsLoading(true);
        try {
            const iframeApi: any = await getIframeAPI(iframeRef.current);
            await iframeApi.run(
                currentArtifact.code,
                currentArtifact.filename,
                currentArtifact.filetype,
            );
        } catch (error) {
            console.error("Failed to run code:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (iframeRef.current) {
            runCode();
        }
    }, [iframeKey, currentArtifact.code]);

    return (
        <>
            <iframe
                key={iframeKey}
                ref={iframeRef}
                src="https://langgraph-artifacts.netlify.app/index.html"
                className="w-full h-full border-none"
            />
            {isLoading && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-2 bg-background/80 rounded-lg p-4 shadow-md">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <p className="text-sm font-medium">正在加载代码...</p>
                    </div>
                </div>
            )}
        </>
    );
};
