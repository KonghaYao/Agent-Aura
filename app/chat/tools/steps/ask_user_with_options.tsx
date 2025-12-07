import { createUITool, ToolManager } from "@langgraph-js/sdk";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ListChecks, MessageSquarePlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

        const canInteract = tool.state === "interrupted";
        const handleSubmit = () => {
            const selectedLabels = selected
                .map((i) => optionItems[i]?.label)
                .filter((i) => i !== undefined);
            const customTextLabel = customText.trim()
                ? `, Custom Text: ${customText.trim()}`
                : "";
            tool.sendResumeData({
                type: "reject",
                message: `User Selected: ${
                    selected.length > 0 ? selectedLabels.join(", ") : "none"
                } ${customTextLabel}`,
            });
        };

        const isSubmitDisabled =
            !canInteract ||
            (selected.length === 0 &&
                (!data.allow_custom_input || !customText));

        return (
            <Card className="w-full my-2 border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-3 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-blue-600" />
                            <CardTitle className="text-base font-medium text-blue-900">
                                Question
                            </CardTitle>
                        </div>
                        <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-700 border-blue-200"
                        >
                            {isMulti ? "多选" : "单选"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                    <div className="text-sm font-medium text-gray-900 bg-white p-3 rounded-md border border-blue-100 shadow-sm">
                        {data.label}
                    </div>

                    {optionItems.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wider opacity-80">
                                Options
                            </div>
                            <div className="space-y-1">
                                {optionItems.map((opt: any) => (
                                    <div
                                        key={opt.index}
                                        className={`flex items-center gap-2 p-2 bg-white/60 rounded border transition-all ${
                                            canInteract &&
                                            "hover:border-blue-200"
                                        }`}
                                        onClick={() =>
                                            canInteract &&
                                            toggleOption(opt.index)
                                        }
                                    >
                                        <span className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded text-[11px] text-blue-700 font-semibold">
                                            {opt.index}
                                        </span>
                                        <span className="text-sm text-gray-800 flex-1">
                                            {opt.label}
                                        </span>
                                        {canInteract && (
                                            <span
                                                className={`text-xs font-semibold ${
                                                    selected.includes(opt.index)
                                                        ? "text-blue-700"
                                                        : "text-gray-400"
                                                }`}
                                            >
                                                {selected.includes(opt.index)
                                                    ? isMulti
                                                        ? "已选择"
                                                        : "当前选择"
                                                    : "可选择"}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.allow_custom_input && (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-blue-700">
                                <MessageSquarePlus className="w-4 h-4" />
                                <span>用户可输入自定义文本</span>
                            </div>
                            <textarea
                                className="w-full rounded border border-blue-100 bg-white/70 p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                placeholder="请输入补充信息（可选）"
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value)}
                                disabled={!canInteract}
                                rows={3}
                            />
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitDisabled}
                            className="px-3 py-1.5 text-sm font-medium rounded bg-blue-600 text-white shadow hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                            提交
                        </button>
                    </div>
                    {!canInteract && (
                        <div className="text-xs text-gray-500">
                            当前状态仅展示，等待或已完成交互
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    },
});
