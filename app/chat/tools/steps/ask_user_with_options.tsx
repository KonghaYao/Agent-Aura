import { createUITool, ToolManager } from "@langgraph-js/sdk";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
    ListChecks,
    MessageSquarePlus,
    RefreshCcw,
    Check,
    User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AskUserWithOptionsSchema = {
    label: z.string().describe("Question text to display"),
    type: z
        .enum(["single_select", "multi_select"])
        .default("single_select")
        .describe("Selection mode for this question"),
    options: z
        .array(
            z.object({
                index: z.number().describe("Index of the option"),
                label: z.string().describe("Optional display label"),
            }),
        )
        .describe("Selectable options for the question"),
    allow_custom_input: z
        .boolean()
        .default(true)
        .describe("Allow user to input custom text"),
};

export const ask_user_with_options = createUITool({
    name: "ask_user_with_options",
    description:
        "Render a single question with selectable options and optional custom input.",
    parameters: AskUserWithOptionsSchema,
    handler: ToolManager.waitForUIDone,
    onlyRender: false,
    render(tool) {
        const data = tool.getInputRepaired();
        const optionItems = data.options || [];
        const isMulti = data.type === "multi_select";
        const [selected, setSelected] = useState<number[]>([]);
        const [customText, setCustomText] = useState<string>("");

        const toggleOption = (idx: number) => {
            if (isMulti) {
                setSelected((prev) =>
                    prev.includes(idx)
                        ? prev.filter((i) => i !== idx)
                        : [...prev, idx],
                );
            } else {
                setSelected([idx]);
            }
        };

        const handleReset = () => {
            setSelected([]);
            setCustomText("");
        };

        const canInteract = tool.state === "interrupted";

        const handleSubmit = () => {
            const selectedLabels = selected
                .map((i) => optionItems[i]?.label)
                .filter((i) => i !== undefined);
            const customTextLabel = customText.trim()
                ? `, Custom Text: ${customText.trim()}`
                : "";
            tool.sendResumeData({
                /** @ts-ignore */
                type: "respond",
                message: `User Selected: ${
                    selected.length > 0 ? selectedLabels.join(", ") : "none"
                } ${customTextLabel}`,
            });
        };

        const isSubmitDisabled =
            !canInteract ||
            (selected.length === 0 &&
                (!data.allow_custom_input || !customText));

        // 完成状态视图
        if (!canInteract) {
            return (
                <div className="flex flex-col gap-3 my-2 p-4 bg-gray-50/50 border border-gray-200 rounded-2xl">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                            <ListChecks className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium">Question Answered</span>
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm text-gray-600 pl-1">
                            {data.label}
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-900 bg-white px-3 py-2.5 rounded-xl border border-gray-200">
                            <User className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                            <div className="break-all leading-relaxed">
                                {tool.output
                                    ? typeof tool.output === "string"
                                        ? tool.output
                                        : JSON.stringify(tool.output)
                                    : "Response submitted"}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // 交互状态视图
        return (
            <Card className="w-full my-2 border-gray-200 bg-white shadow-none rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 p-4 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <ListChecks className="w-4 h-4" />
                            </div>
                            <CardTitle className="text-base font-medium text-gray-900">
                                User Input Required
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                onClick={handleReset}
                                title="Reset selection"
                            >
                                <RefreshCcw className="h-3.5 w-3.5" />
                            </Button>
                            <Badge
                                variant="outline"
                                className="bg-white text-gray-600 border-gray-200 font-normal"
                            >
                                {isMulti ? "Multi Select" : "Single Select"}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    <div className="text-sm font-medium text-gray-900">
                        {data.label}
                    </div>

                    {optionItems.length > 0 && (
                        <div className="space-y-2">
                            <div className="space-y-2">
                                {optionItems.map((opt: any) => {
                                    const isSelected = selected.includes(
                                        opt.index,
                                    );
                                    return (
                                        <div
                                            key={opt.index}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                                                isSelected
                                                    ? "bg-blue-50/50 border-blue-500 shadow-sm"
                                                    : "bg-white border-gray-200 hover:border-blue-300",
                                            )}
                                            onClick={() =>
                                                toggleOption(opt.index)
                                            }
                                        >
                                            <div
                                                className={cn(
                                                    "w-5 h-5 rounded flex items-center justify-center border text-[10px] font-medium transition-colors shrink-0",
                                                    isSelected
                                                        ? "bg-blue-500 border-blue-500 text-white"
                                                        : "bg-gray-50 border-gray-200 text-gray-500 group-hover:border-blue-300",
                                                )}
                                            >
                                                {isSelected ? (
                                                    <Check className="w-3 h-3" />
                                                ) : (
                                                    opt.index
                                                )}
                                            </div>
                                            <span
                                                className={cn(
                                                    "text-sm flex-1 leading-snug",
                                                    isSelected
                                                        ? "text-blue-900 font-medium"
                                                        : "text-gray-700",
                                                )}
                                            >
                                                {opt.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {data.allow_custom_input && (
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <MessageSquarePlus className="w-3.5 h-3.5" />
                                <span>Additional Comments</span>
                            </div>
                            <textarea
                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none"
                                placeholder="Type your answer here..."
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value)}
                                rows={3}
                            />
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitDisabled}
                            className={cn(
                                "px-5 rounded-full transition-all duration-200",
                                isSubmitDisabled
                                    ? "bg-gray-100 text-gray-400"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:shadow-blue-200",
                            )}
                        >
                            Submit Response
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    },
});
