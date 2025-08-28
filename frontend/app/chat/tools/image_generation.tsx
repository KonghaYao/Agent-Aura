import { useArtifacts } from "@/app/artifacts/ArtifactsContext";
import { createUITool, ToolRenderData } from "@langgraph-js/sdk";
import {
    ImageIcon,
    DownloadIcon,
    ExternalLinkIcon,
    Loader2,
} from "lucide-react";
import { z } from "zod";

interface ImageGenerationInput {
    prompt: string;
    size?: string;
    seed?: number;
    steps?: number;
}

interface ImageGenerationResponse {
    image_url: string;
}

interface ImageArtifact {
    type: "image";
    url: string;
    prompt: string;
    task_id: string;
}

export const image_generation = createUITool({
    name: "image_tool",
    description: " ",
    parameters: {
        prompt: z.string(),
        size: z.string().default("1024*1024"),
        seed: z.number().optional(),
        steps: z.number().default(4),
    },
    onlyRender: true,
    render(tool: ToolRenderData<ImageGenerationInput, any>) {
        const data = tool.getInputRepaired();
        const output = tool.getJSONOutputSafe();

        // Parse the response - it might be a string or object
        let imageUrl: string | null = null;
        let artifactData: ImageArtifact | null = null;

        if (output) {
            if (typeof output === "string") {
                try {
                    const parsed = JSON.parse(output);
                    imageUrl = parsed.image_url;
                } catch (e) {
                    // If it's not JSON, treat as direct URL
                    imageUrl = output;
                }
            } else if (output.image_url) {
                imageUrl = output.image_url;
            }
        }

        // Check if there's artifact data in the tool response
        if (
            tool.output &&
            Array.isArray(tool.output) &&
            tool.output.length > 1
        ) {
            artifactData = tool.output[1] as ImageArtifact;
            if (artifactData && artifactData.url) {
                imageUrl = artifactData.url;
            }
        }

        const handleDownload = async (url: string, filename: string) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } catch (error) {
                console.error("Download failed:", error);
                // Fallback: open in new tab
                window.open(url, "_blank");
            }
        };

        return (
            <div className="p-4 space-y-4">
                {/* Input Information */}
                <div className="space-y-2">
                    <div className="text-sm text-gray-500">
                        <span className="font-medium">Prompt:</span>{" "}
                        {data.prompt}
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400">
                        <span>Size: {data.size || "1024*1024"}</span>
                        {data.seed && <span>Seed: {data.seed}</span>}
                        <span>Steps: {data.steps || 4}</span>
                    </div>
                </div>

                {/* Loading State */}
                {tool.state === "loading" && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating image... This may take a moment</span>
                    </div>
                )}

                {/* Success State with Image */}
                {imageUrl && (
                    <div className="space-y-3">
                        <div className="text-sm text-green-600 font-medium">
                            ✓ Image generated successfully!
                        </div>

                        {/* Image Container */}
                        <div className="border rounded-lg overflow-hidden bg-gray-50">
                            <img
                                src={imageUrl}
                                alt={data.prompt}
                                className="w-full max-w-md mx-auto block"
                                style={{
                                    maxHeight: "400px",
                                    objectFit: "contain",
                                }}
                                onError={(e) => {
                                    console.error(
                                        "Image failed to load:",
                                        imageUrl,
                                    );
                                    (
                                        e.target as HTMLImageElement
                                    ).style.display = "none";
                                }}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    handleDownload(
                                        imageUrl,
                                        `generated-image-${Date.now()}.png`,
                                    )
                                }
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    </div>
                )}

                {/* No Result State */}
                {tool.state === "done" && !imageUrl && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ImageIcon className="w-4 h-4" />
                        <span>No image was generated</span>
                    </div>
                )}
            </div>
        );
    },
});
