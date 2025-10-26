import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { SubAgent } from "../../../agent/schema-agent/types";

interface SubAgentsEditorProps {
    subAgents: SubAgent[];
    onChange: (subAgents: SubAgent[]) => void;
}

export function SubAgentsEditor({ subAgents, onChange }: SubAgentsEditorProps) {
    const addSubAgent = () => {
        onChange([
            ...subAgents,
            {
                protocolId: "",
            },
        ]);
    };

    const removeSubAgent = (index: number) => {
        onChange(subAgents.filter((_, i) => i !== index));
    };

    const updateSubAgent = (index: number, protocolId: string) => {
        const newSubAgents = [...subAgents];
        newSubAgents[index] = { protocolId };
        onChange(newSubAgents);
    };

    return (
        <div className="space-y-4 pt-6 border-t">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">子 Agent 配置</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSubAgent}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    添加子 Agent
                </Button>
            </div>

            <div className="space-y-2">
                {subAgents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        暂无子 Agent，点击上方按钮添加
                    </div>
                ) : (
                    subAgents.map((subAgent, index) => (
                        <div
                            key={index}
                            className="p-4 rounded-lg border bg-muted/30"
                        >
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-2">
                                    <Label>Protocol ID</Label>
                                    <Input
                                        value={subAgent.protocolId}
                                        onChange={(e) =>
                                            updateSubAgent(
                                                index,
                                                e.target.value,
                                            )
                                        }
                                        placeholder="输入子 Agent 的 Protocol ID"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeSubAgent(index)}
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
    );
}
