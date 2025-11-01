import { useAgentConfig } from "../context/AgentConfig";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

/**
 * 紧凑版 Agent 选择器
 * 适合在 toolbar 或 header 中使用
 */
export function AgentSelectorCompact() {
    const { currentAgent, availableAgents, selectAgent, clearAgent } =
        useAgentConfig();

    if (availableAgents.length === 0) {
        return null;
    }

    const NONE_VALUE = "__none__";

    return (
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
            <SelectTrigger className="w-[180px] h-9">
                <div className="flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue placeholder="选择 Agent">
                        {currentAgent ? (
                            <span className="truncate">
                                {currentAgent.name}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">
                                默认模式
                            </span>
                        )}
                    </SelectValue>
                </div>
            </SelectTrigger>
            <SelectContent>
                {availableAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">
                                    {agent.name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                    v{agent.version}
                                </Badge>
                            </div>
                            {agent.description && (
                                <span className="text-xs text-muted-foreground line-clamp-1 max-w-64">
                                    {agent.description}
                                </span>
                            )}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
