import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentStoreItem } from "../types";
import { Settings, ExternalLink } from "lucide-react";

interface AgentCardProps {
    agent: AgentStoreItem;
    onEdit: (agent: AgentStoreItem) => void;
}

export function AgentCard({ agent, onEdit }: AgentCardProps) {
    return (
        <Card
            className="flex flex-col h-full hover:shadow-lg transition-all cursor-pointer group hover:scale-[1.02]"
            onClick={() => onEdit(agent)}
        >
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        {agent.iconUrl ? (
                            <img
                                src={agent.iconUrl}
                                alt={agent.name}
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                                {agent.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">
                                {agent.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                    v{agent.version}
                                </Badge>
                                {agent.isActive && (
                                    <Badge
                                        variant="default"
                                        className="text-xs"
                                    >
                                        Active
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1">
                <CardDescription className="line-clamp-3">
                    {agent.description}
                </CardDescription>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">Models:</span>
                        <span className="truncate">
                            {agent.llm.map((l) => l.model).join(", ")}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">Tools:</span>
                        <span>{agent.tools.length} tools</span>
                    </div>

                    {agent.subAgents.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">Sub Agents:</span>
                            <span>{agent.subAgents.length}</span>
                        </div>
                    )}
                </div>

                {agent.tags && agent.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {agent.tags.map((tag, idx) => (
                            <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
