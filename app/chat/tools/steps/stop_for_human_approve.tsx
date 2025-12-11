import { createUITool, ToolManager } from "@langgraph-js/sdk";
import { z } from "zod";
import { CirclePause, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const StopForHumanApproveSchema = {
    description: z.string().describe("The state of your process"),
};

export const stop_for_human_approve = createUITool({
    name: "stop_for_human_approve",
    description: "Stop for human approve",
    parameters: StopForHumanApproveSchema,
    handler: ToolManager.waitForUIDone,
    onlyRender: false,
    render(tool) {
        const data = tool.getInputRepaired();
        const canInteract = tool.state === "interrupted";
        
        const handleApprove = () => {
            tool.sendResumeData({
                /** @ts-ignore */
                type: "respond",
                message: "Approved by human",
            });
        };

        return (
            <Card className="w-full my-2 border-gray-200 bg-gray-50/50">
                <CardHeader className="pb-3 p-4">
                    <div className="flex items-center gap-2">
                        <CirclePause className="w-5 h-5 text-gray-500" />
                        <CardTitle className="text-base font-medium text-gray-700">
                            Waiting for Approval
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                    <div className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                        {data.description || "The process is paused for your approval."}
                    </div>

                    {canInteract ? (
                        <div className="flex items-center justify-end gap-3">
                            <Button
                                size="sm"
                                onClick={handleApprove}
                                variant="outline"
                                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                Approve & Continue
                            </Button>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-500 italic flex items-center gap-1">
                             {tool.output ? (
                                <>
                                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                                    <span>Process continued</span>
                                </>
                             ) : (
                                <span>Approval submitted</span>
                             )}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    },
});

