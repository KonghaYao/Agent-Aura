import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import {
    AgentTool,
    MCPTool,
    BuiltinTool,
    InnerTool,
} from "../../../agent/schema-agent/types";

interface ToolsEditorProps {
    tools: AgentTool[];
    onChange: (tools: AgentTool[]) => void;
}

export function ToolsEditor({ tools, onChange }: ToolsEditorProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const addTool = () => {
        onChange([
            ...tools,
            {
                name: "",
                tool_type: "builtin",
                description: "",
            } as BuiltinTool,
        ]);
        setExpandedIndex(tools.length);
    };

    const removeTool = (index: number) => {
        onChange(tools.filter((_, i) => i !== index));
        if (expandedIndex === index) {
            setExpandedIndex(null);
        }
    };

    const updateTool = (index: number, updates: Partial<AgentTool>) => {
        const newTools = [...tools];
        newTools[index] = { ...newTools[index], ...updates };
        onChange(newTools);
    };

    const updateToolType = (index: number, toolType: string) => {
        const baseTool = {
            name: tools[index].name,
            description: tools[index].description,
        };

        let newTool: AgentTool;
        switch (toolType) {
            case "mcp":
                newTool = {
                    ...baseTool,
                    tool_type: "mcp",
                    type: "",
                    url: "",
                    headers: {},
                } as MCPTool;
                break;
            case "inner":
                newTool = {
                    ...baseTool,
                    tool_type: "inner",
                } as InnerTool;
                break;
            default:
                newTool = {
                    ...baseTool,
                    tool_type: "builtin",
                } as BuiltinTool;
        }

        const newTools = [...tools];
        newTools[index] = newTool;
        onChange(newTools);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">工具配置</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTool}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    添加工具
                </Button>
            </div>

            <div className="space-y-2">
                {tools.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        暂无工具，点击上方按钮添加
                    </div>
                ) : (
                    tools.map((tool, index) => (
                        <div
                            key={index}
                            className="rounded-lg border bg-muted/30"
                        >
                            <div className="p-4 pb-3">
                                <div className="flex items-center justify-between">
                                    <div
                                        className="flex items-center gap-2 cursor-pointer flex-1"
                                        onClick={() =>
                                            setExpandedIndex(
                                                expandedIndex === index
                                                    ? null
                                                    : index,
                                            )
                                        }
                                    >
                                        {expandedIndex === index ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                        <span className="font-medium text-sm">
                                            {tool.name || `工具 ${index + 1}`}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            ({tool.tool_type})
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeTool(index)}
                                    >
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>

                            {expandedIndex === index && (
                                <div className="px-4 pb-4 pt-0 space-y-4 border-t">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>工具名称</Label>
                                            <Input
                                                value={tool.name}
                                                onChange={(e) =>
                                                    updateTool(index, {
                                                        name: e.target.value,
                                                    })
                                                }
                                                placeholder="输入工具名称"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>工具类型</Label>
                                            <Select
                                                value={tool.tool_type}
                                                onValueChange={(v) =>
                                                    updateToolType(index, v)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="builtin">
                                                        Builtin
                                                    </SelectItem>
                                                    <SelectItem value="mcp">
                                                        MCP
                                                    </SelectItem>
                                                    <SelectItem value="inner">
                                                        Inner
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>描述</Label>
                                        <Textarea
                                            value={tool.description || ""}
                                            onChange={(e) =>
                                                updateTool(index, {
                                                    description: e.target.value,
                                                })
                                            }
                                            placeholder="输入工具描述"
                                            rows={2}
                                        />
                                    </div>

                                    {tool.tool_type === "mcp" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Type</Label>
                                                <Input
                                                    value={
                                                        (tool as MCPTool)
                                                            .type || ""
                                                    }
                                                    onChange={(e) =>
                                                        updateTool(index, {
                                                            type: e.target
                                                                .value,
                                                        } as any)
                                                    }
                                                    placeholder="输入 MCP type"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>URL</Label>
                                                <Input
                                                    value={
                                                        (tool as MCPTool).url ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        updateTool(index, {
                                                            url: e.target.value,
                                                        } as any)
                                                    }
                                                    placeholder="输入 MCP URL"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Headers (JSON)</Label>
                                                <Textarea
                                                    value={
                                                        (tool as MCPTool)
                                                            .headers
                                                            ? JSON.stringify(
                                                                  (
                                                                      tool as MCPTool
                                                                  ).headers,
                                                                  null,
                                                                  2,
                                                              )
                                                            : ""
                                                    }
                                                    onChange={(e) => {
                                                        try {
                                                            const headers =
                                                                JSON.parse(
                                                                    e.target
                                                                        .value,
                                                                );
                                                            updateTool(index, {
                                                                headers,
                                                            } as any);
                                                        } catch {
                                                            // 忽略无效的 JSON
                                                        }
                                                    }}
                                                    placeholder='{"Authorization": "Bearer token"}'
                                                    rows={3}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
