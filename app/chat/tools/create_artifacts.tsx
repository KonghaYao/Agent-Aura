import { createToolUI, createUITool, ToolRenderData } from "@langgraph-js/sdk";
import { FileIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useArtifacts } from "../../artifacts/ArtifactsContext";
import { z } from "zod";
import { ArtifactCommandSchema } from "@/agent/tools/create_artifacts";
export const create_artifacts = createUITool({
    name: "create_artifacts",
    description: "创建并保存代码文件到 artifacts 目录",
    parameters: ArtifactCommandSchema,
    onlyRender: true,
    render(tool) {
        const data = tool.getInputRepaired();
        const { setCurrentArtifactById } = useArtifacts();
        return (
            <div className="p-4 space-y-4">
                <div className="text-sm text-gray-500">
                    创建文件: {data.title}
                </div>
                <div
                    className="border rounded-lg p-2 hover:bg-gray-50"
                    onClick={() => {
                        setCurrentArtifactById(
                            tool.getInputRepaired().id!,
                            tool.message.id!,
                        );
                    }}
                >
                    <div className="flex items-center justify-between select-none cursor-pointer">
                        <div className="flex items-center gap-2">
                            <FileIcon className="w-4 h-4" />
                            <span className="font-xs">{data.title}</span>
                        </div>
                        <span className="text-gray-400">{data.type}</span>
                    </div>
                </div>
            </div>
        );
    },
});
