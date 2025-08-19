"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useChatModel } from "@/hooks/useChatModel"; // 导入新的 hook

const languages = [
    { label: "自动检测", value: "auto" },
    { label: "英语", value: "en" },
    { label: "中文", value: "zh" },
    { label: "日语", value: "ja" },
    { label: "韩语", value: "ko" },
    { label: "法语", value: "fr" },
    { label: "德语", value: "de" },
    { label: "西班牙语", value: "es" },
];

export default function TranslatePage() {
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState("");
    const [sourceLang, setSourceLang] = useState("auto");
    const [targetLang, setTargetLang] = useState("zh"); // 默认翻译成中文
    const [loading, setLoading] = useState(false);
    // const [selectedModel, setSelectedModel] = useState(models.main_model[0]); // 添加模型选择状态，现在通过 hook 提供
    const { selectedModel, setSelectedModel, mainModels, sendMessages } =
        useChatModel({
            model: "qwen-plus",
        }); // 使用 hook

    const handleTranslate = async () => {
        if (!inputText.trim()) return;
        setLoading(true);
        setOutputText("");

        try {
            const fullPrompt = `请将以下文本从${
                sourceLang === "auto" ? "自动检测" : sourceLang
            }翻译成${targetLang}：\\n\\n\`\`\`\\n${inputText.trim()}\n\`\`\`\\n\\n请直接给出翻译结果，不要包含任何额外说明或解释。`;

            let accumulatedResponse = "";
            for await (const chunk of sendMessages([
                { type: "human", content: fullPrompt },
            ])) {
                // 使用 sendPrompt
                accumulatedResponse += chunk;
                setOutputText(accumulatedResponse);
            }
        } catch (error) {
            console.error("翻译失败:", error);
            setOutputText("抱歉，翻译失败，请稍后重试。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full h-full p-4">
            <h2 className="text-2xl font-bold text-center mb-4">翻译工具</h2>

            <div className="flex gap-4 flex-1">
                {/* 左侧：源语言选择 + 输入文本框 */}
                <div className="flex-1 flex flex-col gap-2">
                    <Select value={sourceLang} onValueChange={setSourceLang}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="源语言" />
                        </SelectTrigger>
                        <SelectContent>
                            {languages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Textarea
                        placeholder="输入需要翻译的文本..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleTranslate();
                            }
                        }}
                        className="flex-1 min-h-[200px]"
                    />
                </div>

                {/* 右侧：目标语言选择 + 输出文本框 + 复制按钮 */}
                <div className="flex-1 flex flex-col gap-2 relative">
                    <Select value={targetLang} onValueChange={setTargetLang}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="目标语言" />
                        </SelectTrigger>
                        <SelectContent>
                            {languages
                                .filter((lang) => lang.value !== "auto")
                                .map((lang) => (
                                    <SelectItem
                                        key={lang.value}
                                        value={lang.value}
                                    >
                                        {lang.label}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                    <Textarea
                        placeholder="翻译结果将显示在这里..."
                        value={outputText}
                        readOnly
                        className="flex-1 min-h-[200px] bg-gray-100 dark:bg-gray-800"
                    />
                    <Button
                        onClick={() =>
                            navigator.clipboard.writeText(outputText)
                        }
                        className="absolute bottom-2 right-2 p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
                        size="sm"
                        disabled={!outputText}
                    >
                        复制
                    </Button>
                </div>
            </div>

            {/* 底部：模型选择 */}
            <div className="flex justify-start mt-4 gap-4">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                        {mainModels.map((model) => (
                            <SelectItem key={model} value={model}>
                                {model}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {/* 翻译按钮 */}
                <Button
                    onClick={handleTranslate}
                    disabled={loading || !inputText.trim()}
                    className="flex-1"
                >
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        "翻译"
                    )}
                </Button>
            </div>
        </div>
    );
}
