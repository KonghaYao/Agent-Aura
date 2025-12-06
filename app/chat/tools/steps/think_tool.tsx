import { createUITool } from "@langgraph-js/sdk";
import { z } from "zod";
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ThinkToolSchema = {
    reflection: z.string().describe("The reflection content"),
};

export const think_tool = createUITool({
    name: "think_tool",
    description: "Strategic reflection tool for research planning",
    parameters: ThinkToolSchema,
    onlyRender: true,
    render(tool) {
        const data = tool.getInputRepaired();

        return (
            <div className="flex flex-col w-full my-2">
                <Card className="bg-amber-50/50 border-amber-200">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-1.5 bg-amber-100 rounded-full">
                                <Brain className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-amber-900 mb-1 flex items-center gap-2">
                                    Strategic Reflection
                                </h4>
                                <div className="text-sm text-amber-800 whitespace-pre-wrap leading-relaxed font-medium opacity-90">
                                    {data.reflection}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    },
});
