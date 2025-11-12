import { createToolUI, createUITool, ToolRenderData } from "@langgraph-js/sdk";
import {
    FileIcon,
    CodeIcon,
    FileTextIcon,
    ImageIcon,
    SparklesIcon,
    CheckCircleIcon,
} from "lucide-react";
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

        // 根据文件类型获取对应的图标和颜色
        const getFileTypeInfo = (type: string) => {
            const typeLower = type.toLowerCase();
            if (
                typeLower.includes("react") ||
                typeLower.includes("tsx") ||
                typeLower.includes("jsx")
            ) {
                return {
                    icon: CodeIcon,
                    color: "text-blue-600",
                    bgColor: "bg-blue-50",
                    borderColor: "border-blue-200",
                };
            }
            if (typeLower.includes("python") || typeLower.includes("py")) {
                return {
                    icon: CodeIcon,
                    color: "text-green-600",
                    bgColor: "bg-green-50",
                    borderColor: "border-green-200",
                };
            }
            if (typeLower.includes("markdown") || typeLower.includes("md")) {
                return {
                    icon: FileTextIcon,
                    color: "text-purple-600",
                    bgColor: "bg-purple-50",
                    borderColor: "border-purple-200",
                };
            }
            if (
                typeLower.includes("image") ||
                typeLower.includes("png") ||
                typeLower.includes("jpg") ||
                typeLower.includes("svg")
            ) {
                return {
                    icon: ImageIcon,
                    color: "text-pink-600",
                    bgColor: "bg-pink-50",
                    borderColor: "border-pink-200",
                };
            }
            // 默认代码文件
            return {
                icon: FileIcon,
                color: "text-gray-600",
                bgColor: "bg-gray-50",
                borderColor: "border-gray-200",
            };
        };

        const fileTypeInfo = getFileTypeInfo(data.type || "");
        const FileTypeIcon = fileTypeInfo.icon;

        return (
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-amber-500" />
                        创建代码文件
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircleIcon className="w-3 h-3" />
                        已保存
                    </div>
                </div>

                <div
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${fileTypeInfo.borderColor}`}
                    onClick={() => {
                        setCurrentArtifactById(
                            tool.getInputRepaired().id!,
                            tool.message.id!,
                        );
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                                className={`p-2 rounded-lg border ${fileTypeInfo.borderColor}`}
                            >
                                <FileTypeIcon
                                    className={`w-5 h-5 ${fileTypeInfo.color}`}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate text-sm">
                                    {data.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${fileTypeInfo.color} ${fileTypeInfo.borderColor}`}
                                    >
                                        {data.type}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <div className="text-xs text-gray-400">查看 →</div>
                        </div>
                    </div>

                    {/* 文件路径提示 */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <FileIcon className="w-3 h-3" />
                            <span>artifacts/{data.title}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
});
