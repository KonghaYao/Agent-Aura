import { useAgentConfig } from "../context/AgentConfig";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, RefreshCw, Settings } from "lucide-react";

interface AgentSelectorProps {
    onOpenSettings?: () => void;
}

export function AgentSelector({ onOpenSettings }: AgentSelectorProps) {
    const {
        currentAgent,
        availableAgents,
        selectAgent,
        clearAgent,
        refreshAgents,
        isLoading,
    } = useAgentConfig();

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="w-4 h-4 animate-spin" />
                <span>加载中...</span>
            </div>
        );
    }

    if (availableAgents.length === 0) {
        return (
            <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                    暂无可用的 Agent
                </div>
                {onOpenSettings && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenSettings}
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        配置 Agent
                    </Button>
                )}
            </div>
        );
    }

    const NONE_VALUE = "__none__";

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Agent:</span>
            </div>

            <Select
                value={currentAgent?.id || NONE_VALUE}
                onValueChange={(value) => {
                    if (value === NONE_VALUE) {
                        clearAgent();
                    } else {
                        selectAgent(value);
                    }
                }}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="选择 Agent">
                        {currentAgent ? (
                            <div className="flex items-center gap-2">
                                <span>{currentAgent.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                    v{currentAgent.version}
                                </Badge>
                            </div>
                        ) : (
                            "选择 Agent"
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={NONE_VALUE}>
                        <span className="text-muted-foreground">
                            不使用 Agent
                        </span>
                    </SelectItem>
                    {availableAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex items-center gap-2">
                                <span>{agent.name}</span>
                                <Badge variant="outline" className="text-xs">
                                    v{agent.version}
                                </Badge>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => refreshAgents()}
                title="刷新 Agent 列表"
            >
                <RefreshCw className="w-4 h-4" />
            </Button>

            {onOpenSettings && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenSettings}
                    title="管理 Agent"
                >
                    <Settings className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}
