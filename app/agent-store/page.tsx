import { useState, useEffect } from "react";
import { AgentStoreItem } from "./types";
import { AgentGallery } from "./components/AgentGallery";
import { AgentForm } from "./components/AgentForm";
import { AgentStoreService } from "./services/agentStoreService";
// import { AgentSchemaList } from "./mockData"; // 移除 AgentSchemaList 导入
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // 添加 Input 导入
import { toast } from "sonner";
import { Download, Upload, Trash, ArrowLeft, Search } from "lucide-react"; // 移除 Database 导入，添加 Search 导入

type ViewMode = "gallery" | "edit";

export default function AgentStorePage() {
    const [agents, setAgents] = useState<AgentStoreItem[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<AgentStoreItem | null>(
        null,
    );
    const [viewMode, setViewMode] = useState<ViewMode>("gallery");
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(""); // 添加 searchQuery 状态

    // 加载 agents
    useEffect(() => {
        loadAgents(searchQuery);
    }, [searchQuery]); // 监听 searchQuery 变化

    const loadAgents = async (query?: string) => {
        try {
            setIsLoading(true);
            const { data } = await AgentStoreService.getAllAgents(query);
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

    // 移除 handleLoadMockData, handleExport, handleImport, handleClearAll
    // const handleLoadMockData = async () => { ... };
    // const handleExport = async () => { ... };
    // const handleImport = () => { ... };
    // const handleClearAll = async () => { ... };

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
                    <div className="flex gap-2 items-center">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索 Agent..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button variant="default" onClick={handleCreateAgent}>
                            创建 Agent
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
