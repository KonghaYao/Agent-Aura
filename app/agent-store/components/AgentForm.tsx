import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, X } from "lucide-react";
import { AgentStoreItem } from "../types";
import { ToolsEditor } from "./ToolsEditor.jsx";
import { SubAgentsEditor } from "./SubAgentsEditor.jsx";
import { BuiltinTool, InnerTool, MCPTool } from "@/agent/schema-agent/types.js";

interface AgentFormProps {
    agent: AgentStoreItem | null;
    onSave: (agent: AgentStoreItem) => void;
    onCancel: () => void;
    children?: React.ReactNode;
}

export function AgentForm({
    agent,
    onSave,
    onCancel,
    children,
}: AgentFormProps) {
    const [formData, setFormData] = useState<AgentStoreItem>(
        agent || {
            id: crypto.randomUUID(),
            protocolVersion: "1.0",
            name: "",
            description: "",
            url: "",
            iconUrl: "",
            version: "1.0.0",
            documentationUrl: "",
            systemPrompt: "",
            llm: [],
            tools: [],
            subAgents: [],
            isActive: false,
            tags: [],
        },
    );

    useEffect(() => {
        if (agent) {
            setFormData(agent);
        }
    }, [agent]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const addLLM = () => {
        setFormData({
            ...formData,
            llm: [...formData.llm, { provider: "", model: "" }],
        });
    };

    const removeLLM = (index: number) => {
        setFormData({
            ...formData,
            llm: formData.llm.filter((_, i) => i !== index),
        });
    };

    const updateLLM = (
        index: number,
        field: "provider" | "model",
        value: string,
    ) => {
        const newLLM = [...formData.llm];
        newLLM[index] = { ...newLLM[index], [field]: value };
        setFormData({ ...formData, llm: newLLM });
    };

    const addTag = (tag: string) => {
        if (tag && !formData.tags?.includes(tag)) {
            setFormData({
                ...formData,
                tags: [...(formData.tags || []), tag],
            });
        }
    };

    const removeTag = (tag: string) => {
        setFormData({
            ...formData,
            tags: formData.tags?.filter((t) => t !== tag),
        });
    };

    const [newTag, setNewTag] = useState("");

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-end gap-2 sticky bottom-4 p-4">
                {children && (
                    <div className="flex items-center gap-2">{children}</div>
                )}
                <div className="flex-1"></div>
                <Button type="button" variant="outline" onClick={onCancel}>
                    取消
                </Button>
                <Button type="submit">
                    {agent ? "保存更改" : "创建 Agent"}
                </Button>
            </div>
            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                    <TabsTrigger value="basic">基本信息</TabsTrigger>
                    <TabsTrigger value="llm">模型配置</TabsTrigger>
                    <TabsTrigger value="tools">工具配置</TabsTrigger>
                    <TabsTrigger value="advanced">高级配置</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 mt-6">
                    <div className="space-y-6 p-6 rounded-lg border bg-card">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                基本信息
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">名称 *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        required
                                        placeholder="输入 Agent 名称"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="version">版本 *</Label>
                                    <Input
                                        id="version"
                                        value={formData.version}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                version: e.target.value,
                                            })
                                        }
                                        required
                                        placeholder="1.0.0"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">描述 *</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    required
                                    placeholder="描述这个 Agent 的功能和用途"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="url">URL *</Label>
                                    <Input
                                        id="url"
                                        value={formData.url}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                url: e.target.value,
                                            })
                                        }
                                        required
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="iconUrl">图标 URL</Label>
                                    <Input
                                        id="iconUrl"
                                        value={formData.iconUrl || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                iconUrl: e.target.value,
                                            })
                                        }
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="documentationUrl">
                                    文档 URL
                                </Label>
                                <Input
                                    id="documentationUrl"
                                    value={formData.documentationUrl || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            documentationUrl: e.target.value,
                                        })
                                    }
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>标签</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newTag}
                                        onChange={(e) =>
                                            setNewTag(e.target.value)
                                        }
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addTag(newTag);
                                                setNewTag("");
                                            }
                                        }}
                                        placeholder="输入标签后按 Enter"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            addTag(newTag);
                                            setNewTag("");
                                        }}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {formData.tags && formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.tags.map((tag, idx) => (
                                            <Badge
                                                key={idx}
                                                variant="secondary"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeTag(tag)
                                                    }
                                                    className="ml-1 hover:text-destructive"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-4 border-t">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        isActive: e.target.checked,
                                    })
                                }
                                className="w-4 h-4"
                            />
                            <Label
                                htmlFor="isActive"
                                className="cursor-pointer"
                            >
                                激活此 Agent
                            </Label>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="llm" className="space-y-6 mt-6">
                    <div className="space-y-6 p-6 rounded-lg border bg-card">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">
                                语言模型配置
                            </h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addLLM}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                添加模型
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {formData.llm.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    暂无模型配置，点击上方按钮添加
                                </div>
                            ) : (
                                formData.llm.map((llm, index) => (
                                    <div
                                        key={index}
                                        className="p-4 rounded-lg border bg-muted/30"
                                    >
                                        <div className="flex gap-4">
                                            <div className="flex-1 space-y-2">
                                                <Label>Provider</Label>
                                                <Input
                                                    value={llm.provider || ""}
                                                    onChange={(e) =>
                                                        updateLLM(
                                                            index,
                                                            "provider",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="openai, anthropic, etc."
                                                />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <Label>Model *</Label>
                                                <Input
                                                    value={llm.model}
                                                    onChange={(e) =>
                                                        updateLLM(
                                                            index,
                                                            "model",
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                    placeholder="gpt-4, claude-3-opus, etc."
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        removeLLM(index)
                                                    }
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="tools" className="space-y-6 mt-6">
                    <div className="space-y-6 p-6 rounded-lg border bg-card">
                        <ToolsEditor
                            tools={formData.tools}
                            onChange={(tools) =>
                                setFormData({
                                    ...formData,
                                    tools: tools as (
                                        | BuiltinTool
                                        | InnerTool
                                        | MCPTool
                                    )[],
                                })
                            }
                        />
                    </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6 mt-6">
                    <div className="space-y-6 p-6 rounded-lg border bg-card">
                        <div className="space-y-2">
                            <Label htmlFor="systemPrompt">系统提示词 *</Label>
                            <Textarea
                                id="systemPrompt"
                                value={formData.systemPrompt}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        systemPrompt: e.target.value,
                                    })
                                }
                                required
                                placeholder="输入系统提示词..."
                                rows={10}
                                className="font-mono text-sm"
                            />
                        </div>

                        <SubAgentsEditor
                            subAgents={formData.subAgents}
                            onChange={(subAgents) =>
                                setFormData({ ...formData, subAgents })
                            }
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </form>
    );
}
