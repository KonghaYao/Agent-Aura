import { useArtifacts } from "@/app/artifacts/ArtifactsContext";
import { createUITool, ToolRenderData } from "@langgraph-js/sdk";
import { ExternalLinkIcon, FileTextIcon, LinkIcon } from "lucide-react";
import { z } from "zod";

interface ReadWebPageInput {
    url: string;
}

interface ReadWebPageResponse {
    content: string;
    title?: string;
    url: string;
}

export const read_web_page_tool = createUITool({
    name: "read_web_page",
    description:
        "读取指定网页的内容，并将其转换为 markdown 格式。可以用于获取网页的文本内容、文档内容等。",
    parameters: {
        url: z.string().url(),
    },
    onlyRender: true,
    render(tool: ToolRenderData<ReadWebPageInput, ReadWebPageResponse>) {
        const data = tool.getInputRepaired();
        const response = tool.output;

        const openWebPageContent = () => {
            if (response) {
                // 由于临时 artifact 功能被移除，这里暂时只在新标签页打开
                // 后续可以考虑其他方式展示内容
                const blob = new Blob([response], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
            }
        };

        const openOriginalUrl = () => {
            window.open(data.url, "_blank", "noopener,noreferrer");
        };

        return (
            <div className="p-4 space-y-4">
                <div
                    className="text-sm text-gray-500 flex items-center gap-2 cursor-pointer"
                    onClick={() => openWebPageContent()}
                >
                    <LinkIcon className="w-4 h-4" />
                    <span>读取网页: {data.url}</span>
                </div>

                {tool.state === "loading" && (
                    <div className="text-sm text-gray-500">
                        正在读取网页内容...
                    </div>
                )}
            </div>
        );
    },
});
