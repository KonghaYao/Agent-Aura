import { useState, useEffect } from "react";
import { AgentStoreItem } from "./types";
import { AgentGallery } from "./components/AgentGallery";
import { AgentForm } from "./components/AgentForm";
import { AgentStoreService } from "./services/agentStoreService";
import { mockAgents } from "./mockData";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Upload, Trash, Database, ArrowLeft } from "lucide-react";

type ViewMode = "gallery" | "edit";

export default function AgentStorePage() {
    const [agents, setAgents] = useState<AgentStoreItem[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<AgentStoreItem | null>(
        null,
    );
    const [viewMode, setViewMode] = useState<ViewMode>("gallery");
    const [isLoading, setIsLoading] = useState(true);

    // 加载 agents
    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            setIsLoading(true);
            const data = await AgentStoreService.getAllAgents();
            setAgents(data);
        } catch (error) {
            toast.error("加载失败", {
                description: "无法加载 Agent 列表",
            });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadMockData = async () => {
        try {
            // 直接使用 service 创建 mock agents
            for (const mockAgent of mockAgents) {
                await AgentStoreService.createAgent(mockAgent);
            }
            await loadAgents();
            toast.success("加载成功", {
                description: `已加载 ${mockAgents.length} 个示例 Agent`,
            });
        } catch (error) {
            toast.error("加载失败", {
                description: "无法加载示例数据",
            });
            console.error(error);
        }
    };

    const handleCreateAgent = () => {
        setSelectedAgent(null);
        setViewMode("edit");
    };

    const handleEditAgent = (agent: AgentStoreItem) => {
        setSelectedAgent(agent);
        setViewMode("edit");
    };

    const handleBackToGallery = () => {
        setViewMode("gallery");
        setSelectedAgent(null);
    };

    const handleSaveAgent = async (agent: AgentStoreItem) => {
        try {
            if (selectedAgent) {
                // 更新现有 agent
                await AgentStoreService.updateAgent(agent.id, agent);
                toast.success("更新成功", {
                    description: `Agent "${agent.name}" 已更新`,
                });
            } else {
                // 创建新 agent
                await AgentStoreService.createAgent(agent);
                toast.success("创建成功", {
                    description: `Agent "${agent.name}" 已创建`,
                });
            }
            await loadAgents();
            handleBackToGallery();
        } catch (error) {
            toast.error("保存失败", {
                description: "无法保存 Agent 数据",
            });
            console.error(error);
        }
    };

    const handleExport = async () => {
        try {
            const jsonData = await AgentStoreService.exportAgents();
            const blob = new Blob([jsonData], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `agents-export-${
                new Date().toISOString().split("T")[0]
            }.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("导出成功", {
                description: "Agent 数据已导出",
            });
        } catch (error) {
            toast.error("导出失败", {
                description: "无法导出 Agent 数据",
            });
            console.error(error);
        }
    };

    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                await AgentStoreService.importAgents(text);
                await loadAgents();

                toast.success("导入成功", {
                    description: "Agent 数据已导入",
                });
            } catch (error) {
                toast.error("导入失败", {
                    description: "无法导入 Agent 数据，请检查文件格式",
                });
                console.error(error);
            }
        };
        input.click();
    };

    const handleClearAll = async () => {
        if (!confirm("确定要清空所有 Agent 数据吗？此操作不可恢复。")) {
            return;
        }

        try {
            await AgentStoreService.clearAll();
            await loadAgents();

            toast.success("已清空", {
                description: "所有 Agent 数据已清空",
            });
        } catch (error) {
            toast.error("清空失败", {
                description: "无法清空 Agent 数据",
            });
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">加载中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Agent Store</h1>
                        <p className="text-muted-foreground mt-2">
                            管理和配置你的 AI Agents
                        </p>
                    </div>
                </div>

                {viewMode === "gallery" && (
                    <div className="flex gap-2">
                        {agents.length === 0 && (
                            <Button
                                variant="default"
                                onClick={handleLoadMockData}
                            >
                                <Database className="w-4 h-4 mr-2" />
                                加载示例数据
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleImport}>
                            <Upload className="w-4 h-4 mr-2" />
                            导入
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={agents.length === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            导出
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleClearAll}
                            disabled={agents.length === 0}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash className="w-4 h-4 mr-2" />
                            清空
                        </Button>
                    </div>
                )}
            </div>

            {/* 内容区域 */}
            {viewMode === "gallery" ? (
                <AgentGallery
                    agents={agents}
                    onEditAgent={handleEditAgent}
                    onCreateAgent={handleCreateAgent}
                />
            ) : (
                <div className="max-w-5xl mx-auto">
                    <AgentForm
                        agent={selectedAgent}
                        onSave={handleSaveAgent}
                        onCancel={handleBackToGallery}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBackToGallery}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </AgentForm>
                </div>
            )}
        </div>
    );
}
