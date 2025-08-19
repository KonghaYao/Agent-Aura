"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useChatModel } from "@/hooks/useChatModel";
import { TmpFilesClient } from "@/app/chat/FileUpload"; // 导入 TmpFilesClient
import { ImageDown } from "lucide-react"; // 导入图标
import { Message } from "@/hooks/useChatModel"; // 导入 Message 类型
import { imageRecognitionPrompts, ImageRecognitionPrompt } from "./prompts"; // 导入 prompt 模板
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ImageRecognitionPage() {
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [attachedText, setAttachedText] = useState("");
    const [recognitionResult, setRecognitionResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedPromptTemplate, setSelectedPromptTemplate] =
        useState<ImageRecognitionPrompt>(imageRecognitionPrompts[0]); // 添加 prompt 模板选择状态
    const tmpFilesClient = new TmpFilesClient();

    const { selectedModel, setSelectedModel, mainModels, sendMessages } =
        useChatModel({
            model: "gemini-2.0-flash", // 默认模型，更改为 gemini-2.0-flash
        });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const imageFiles = selectedFiles.filter((file) =>
            file.type.startsWith("image/"),
        );

        if (imageFiles.length === 0) return;
        setLoading(true);

        for (const file of imageFiles) {
            try {
                const result = await tmpFilesClient.upload(file);
                if (result.data && result.data.url) {
                    // 明确检查 result.data
                    setImageUrls((prev) => [...prev, result.data!.url]);
                }
            } catch (error) {
                console.error("图片上传失败:", error);
            }
        }
        setLoading(false);
        e.target.value = ""; // 清空文件输入，允许再次选择相同文件
    };

    const removeImage = (index: number) => {
        setImageUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRecognize = async () => {
        if (imageUrls.length === 0 && !attachedText.trim()) {
            alert("请上传图片或输入附加文本。");
            return;
        }
        setLoading(true);
        setRecognitionResult("");

        try {
            const contentParts: (
                | { type: "text"; text: string }
                | { type: "image_url"; image_url: { url: string } }
            )[] = [];

            // 添加图片信息
            imageUrls.forEach((url) => {
                contentParts.push({ type: "image_url", image_url: { url } });
            });

            // 添加附加文本
            if (attachedText.trim()) {
                contentParts.push({
                    type: "text",
                    text: `附加文本：\n${attachedText.trim()}`,
                });
            }

            // 添加主要指令
            const finalPrompt =
                selectedPromptTemplate.value === "custom" && attachedText.trim()
                    ? attachedText.trim()
                    : selectedPromptTemplate.prompt +
                      (attachedText.trim()
                          ? `\n\n用户附加文本：\n${attachedText.trim()}`
                          : "");
            contentParts.push({ type: "text", text: finalPrompt });

            const messages: Message[] = [
                { type: "human", content: contentParts }, // 明确指定 type 为 'human'
            ];

            let accumulatedResponse = "";
            for await (const chunk of sendMessages(messages)) {
                // 使用 sendMessages
                accumulatedResponse += chunk;
                setRecognitionResult(accumulatedResponse);
            }
        } catch (error) {
            console.error("图片识别失败:", error);
            setRecognitionResult("抱歉，图片识别失败，请稍后重试。");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setImageUrls([]);
        setAttachedText("");
        setRecognitionResult("");
        setLoading(false);
    };

    // 移除了 handlePaste 的 async 关键字，因为它不再是直接挂载到 DOM 上的事件处理器
    const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault(); // 阻止默认粘贴行为

                const file = items[i].getAsFile();
                if (file) {
                    setLoading(true);
                    // 使用立即执行的 async 函数来处理异步上传
                    (async () => {
                        try {
                            const result = await tmpFilesClient.upload(file);
                            if (result.data && result.data.url) {
                                setImageUrls((prev) => [
                                    ...prev,
                                    result.data!.url,
                                ]);
                            }
                        } catch (error) {
                            console.error("粘贴图片上传失败:", error);
                        } finally {
                            setLoading(false);
                        }
                    })();
                }
            }
        }
    };

    // 使用 useEffect 来添加和移除全局粘贴事件监听器
    useEffect(() => {
        window.addEventListener("paste", handlePaste);
        return () => {
            window.removeEventListener("paste", handlePaste);
        };
    }, []); // 空依赖数组表示只在组件挂载和卸载时运行

    return (
        <div className="flex flex-col gap-4 w-full h-full p-4 overflow-y-auto">
            {" "}
            {/* 添加 overflow-y-auto */}
            <h2 className="text-2xl font-bold text-center mb-4">
                图片识别与数据提取
            </h2>
            <div className="flex gap-4 flex-1">
                {/* 左侧：图片展示与附加文本 */}
                <div className="flex-1 flex flex-col gap-2 relative bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-2 mb-4 overflow-y-auto max-h-[50%]">
                        {imageUrls.map((url, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={url}
                                    alt={`Uploaded ${index + 1}`}
                                    className="w-full h-auto rounded-md object-cover"
                                />
                                <Button
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity aspect-video"
                                    size="icon"
                                >
                                    &times;
                                </Button>
                            </div>
                        ))}
                        <label
                            htmlFor="image-upload"
                            className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors aspect-video"
                        >
                            <ImageDown className="w-8 h-8 text-gray-400" />
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={loading}
                            />
                        </label>
                    </div>
                    <Textarea
                        placeholder="输入附加文本或数据... (可选)"
                        value={attachedText}
                        onChange={(e) => setAttachedText(e.target.value)}
                        className="flex-1 h-full overflow-y-auto" // 添加 max-h 和 overflow-y-auto
                        disabled={loading}
                    />
                </div>

                {/* 右侧：识别结果 */}
                <div className="flex-1 flex flex-col gap-2 relative">
                    <Textarea
                        placeholder="图片识别结果将显示在这里..."
                        value={recognitionResult}
                        readOnly
                        className="flex-1 h-full overflow-y-auto bg-gray-100 dark:bg-gray-800" // 添加 max-h 和 overflow-y-auto
                    />
                    <Button
                        onClick={() =>
                            navigator.clipboard.writeText(recognitionResult)
                        }
                        className="absolute bottom-2 right-2 p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
                        size="sm"
                        disabled={!recognitionResult}
                    >
                        复制
                    </Button>
                </div>
            </div>
            {/* 底部操作按钮和模型选择 */}
            <div className="flex justify-between items-center mt-4">
                <Button
                    onClick={handleRecognize}
                    disabled={
                        loading ||
                        (imageUrls.length === 0 && !attachedText.trim())
                    }
                    className="w-full sm:w-auto px-6 py-2"
                >
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        "识别数据"
                    )}
                </Button>
                <Button
                    onClick={handleClear}
                    variant="outline"
                    disabled={
                        loading ||
                        (imageUrls.length === 0 &&
                            !attachedText.trim() &&
                            !recognitionResult.trim())
                    }
                    className="ml-2 px-6 py-2"
                >
                    清除
                </Button>

                <div className="flex-1 flex justify-end gap-2">
                    {/* Prompt 模板选择 */}
                    <Select
                        value={selectedPromptTemplate.value}
                        onValueChange={(value) => {
                            const selected = imageRecognitionPrompts.find(
                                (p) => p.value === value,
                            );
                            if (selected) {
                                setSelectedPromptTemplate(selected);
                                if (selected.value !== "custom") {
                                    setAttachedText(selected.prompt);
                                } else {
                                    setAttachedText(""); // 自定义模板清空附加文本
                                }
                            }
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="选择 Prompt 模板" />
                        </SelectTrigger>
                        <SelectContent>
                            {imageRecognitionPrompts.map((template) => (
                                <SelectItem
                                    key={template.value}
                                    value={template.value}
                                >
                                    {template.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 模型选择 */}
                    <Select
                        value={selectedModel}
                        onValueChange={setSelectedModel}
                    >
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
                </div>
            </div>
        </div>
    );
}
