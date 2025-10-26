import { useAgentConfig } from "../context/AgentConfig";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Bot, Sparkles, Wrench } from "lucide-react";

/**
 * Agent 信息面板
 * 显示当前选中 Agent 的详细信息
 */
export function AgentInfoPanel() {
    const { currentAgent } = useAgentConfig();

    if (!currentAgent) {
        return null;
    }

    return (
        <div className="flex items-start gap-3 flex-col">
            <div className="p-2 rounded-lg flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <div className="flex items-center gap-2 ">
                    <span className="font-semibold text-sm">
                        {currentAgent.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                        v{currentAgent.version}
                    </Badge>
                </div>
            </div>

            <div className="flex-1 min-w-0 hidden group-hover:block">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {currentAgent.description}
                </p>

                <div className="items-center gap-3 text-xs text-muted-foreground">
                    {currentAgent.llm.length > 0 && (
                        <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>{currentAgent.llm[0].model}</span>
                        </div>
                    )}

                    {currentAgent.tools.length > 0 && (
                        <div className="flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            <span>{currentAgent.tools.length} 工具</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
