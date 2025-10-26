import { useState } from "react";
import { AgentStoreItem } from "../types";
import { AgentCard } from "./AgentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Filter } from "lucide-react";

interface AgentGalleryProps {
    agents: AgentStoreItem[];
    onEditAgent: (agent: AgentStoreItem) => void;
    onCreateAgent: () => void;
}

export function AgentGallery({
    agents,
    onEditAgent,
    onCreateAgent,
}: AgentGalleryProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<
        "all" | "active" | "inactive"
    >("all");
    const [sortBy, setSortBy] = useState<"name" | "updated" | "created">(
        "name",
    );

    // 过滤和排序逻辑
    const filteredAgents = agents
        .filter((agent) => {
            // 搜索过滤
            const matchesSearch =
                agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                agent.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                agent.tags?.some((tag) =>
                    tag.toLowerCase().includes(searchQuery.toLowerCase()),
                );

            // 状态过滤
            const matchesStatus =
                filterStatus === "all" ||
                (filterStatus === "active" && agent.isActive) ||
                (filterStatus === "inactive" && !agent.isActive);

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "updated":
                    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
                case "created":
                    return (b.createdAt || "").localeCompare(a.createdAt || "");
                default:
                    return 0;
            }
        });

    return (
        <div className="space-y-6">
            {/* 工具栏 */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索 agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex gap-2">
                    <Select
                        value={filterStatus}
                        onValueChange={(v: any) => setFilterStatus(v)}
                    >
                        <SelectTrigger className="w-[140px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部</SelectItem>
                            <SelectItem value="active">激活</SelectItem>
                            <SelectItem value="inactive">未激活</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={sortBy}
                        onValueChange={(v: any) => setSortBy(v)}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">按名称</SelectItem>
                            <SelectItem value="updated">最近更新</SelectItem>
                            <SelectItem value="created">最近创建</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={onCreateAgent}>
                        <Plus className="w-4 h-4 mr-2" />
                        新建 Agent
                    </Button>
                </div>
            </div>

            {/* 统计信息 */}
            <div className="text-sm text-muted-foreground">
                显示 {filteredAgents.length} / {agents.length} 个 Agents
            </div>

            {/* Grid Gallery */}
            {filteredAgents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAgents.map((agent) => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            onEdit={onEditAgent}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">未找到匹配的 Agents</p>
                    <Button
                        variant="link"
                        onClick={() => {
                            setSearchQuery("");
                            setFilterStatus("all");
                        }}
                    >
                        清除过滤条件
                    </Button>
                </div>
            )}
        </div>
    );
}
