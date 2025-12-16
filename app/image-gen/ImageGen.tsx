import React, { useState, useRef, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    Download,
    Image as ImageIcon,
    X,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GeneratedImage {
    url: string;
    file: any;
}

export default function ImageGen() {
    const [prompt, setPrompt] = useState("");
    const [count, setCount] = useState("1");
    const [resolution, setResolution] = useState("1K");
    const [aspectRatio, setAspectRatio] = useState("16:9");
    const [loading, setLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(
        [],
    );
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const STORAGE_KEY = "image-gen-generated-images";

    // 从 localStorage 加载保存的图片
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setGeneratedImages(parsed);
                }
            }
        } catch (error) {
            console.error("加载保存的图片失败:", error);
        }
    }, []);

    // 保存图片到 localStorage
    const saveToLocalStorage = (images: GeneratedImage[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
        } catch (error) {
            console.error("保存图片到 localStorage 失败:", error);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("请输入提示词");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/files/generate-image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt,
                    count: parseInt(count),
                    resolution,
                    aspectRatio,
                    inputImageUrls: referenceImages,
                }),
            });

            if (!response.ok) {
                throw new Error("生成失败");
            }

            const data = await response.json();
            if (data.data) {
                setGeneratedImages((prev) => {
                    const newImages = [...data.data, ...prev];
                    saveToLocalStorage(newImages);
                    return newImages;
                });
                toast.success("图片生成成功");
            }
        } catch (error) {
            console.error(error);
            toast.error("图片生成失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("请选择图片文件");
            return;
        }

        setIsUploading(true);
        try {
            // Read file as base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(",")[1];

                try {
                    const response = await fetch("/api/files/upload/imagekit", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            fileName: file.name,
                            fileData: base64String,
                            folder: "/reference-images",
                        }),
                    });

                    if (!response.ok) {
                        throw new Error("上传失败");
                    }

                    const data = await response.json();
                    if (data.data?.image_url) {
                        setReferenceImages((prev) => [
                            ...prev,
                            data.data.image_url,
                        ]);
                        toast.success("参考图上传成功");
                    }
                } catch (error) {
                    console.error("Upload error:", error);
                    toast.error("上传参考图失败");
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("File reading error:", error);
            toast.error("读取文件失败");
        } finally {
            setIsUploading(false);
            // Reset input value to allow selecting the same file again
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const removeReferenceImage = (index: number) => {
        setReferenceImages((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="container flex gap-6">
            {/* Sidebar */}
            <div className="w-[380px] shrink-0 flex flex-col border-r border-border h-[calc(100vh)] bg-background/50">
                <div className="p-6 pb-4 border-b border-border">
                    <h2 className="text-xl font-semibold flex items-center gap-2 tracking-tight">
                        <Sparkles className="w-5 h-5" />
                        AI 图片生成
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        释放创意，描述画面即可生成
                    </p>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-8">
                    {/* Prompt Section */}
                    <div className="space-y-3 flex-1 flex flex-col min-h-0">
                        <Label htmlFor="prompt" className="text-sm font-medium">
                            提示词
                        </Label>
                        <Textarea
                            id="prompt"
                            placeholder="描述一个在夕阳下奔跑的赛博朋克风格的机器人..."
                            className="flex-1 resize-none text-base leading-relaxed bg-background/50 focus:bg-background transition-colors scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    {/* Reference Images */}
                    <div className="space-y-3 shrink-0">
                        <Label className="text-sm font-medium flex justify-between items-center">
                            参考图片
                            <span className="text-xs text-muted-foreground font-normal bg-secondary px-2 py-0.5 rounded-full">
                                可选
                            </span>
                        </Label>
                        <div className="grid grid-cols-4 gap-3">
                            {referenceImages.map((url, index) => (
                                <div
                                    key={index}
                                    className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted/30 group"
                                >
                                    <img
                                        src={url}
                                        alt={`Reference ${index}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() =>
                                            removeReferenceImage(index)
                                        }
                                        className="absolute top-1 right-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-border"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}

                            <div
                                className={cn(
                                    "aspect-square rounded-lg border border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors hover:border-primary/50",
                                    isUploading &&
                                        "opacity-50 cursor-not-allowed bg-muted/20",
                                )}
                                onClick={() =>
                                    !isUploading &&
                                    fileInputRef.current?.click()
                                }
                            >
                                {isUploading ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                ) : (
                                    <ImageIcon className="h-5 w-5 text-muted-foreground/70" />
                                )}
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                    </div>

                    {/* Parameters */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    数量
                                </Label>
                                <Select value={count} onValueChange={setCount}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4].map((num) => (
                                            <SelectItem
                                                key={num}
                                                value={num.toString()}
                                            >
                                                {num} 张
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    分辨率
                                </Label>
                                <Select
                                    value={resolution}
                                    onValueChange={setResolution}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1K">
                                            1K (标准)
                                        </SelectItem>
                                        <SelectItem value="2K">
                                            2K (高清)
                                        </SelectItem>
                                        <SelectItem value="4K">
                                            4K (超清)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                宽高比
                            </Label>
                            <Select
                                value={aspectRatio}
                                onValueChange={setAspectRatio}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="16:9">
                                        16:9 - 宽屏电影感
                                    </SelectItem>
                                    <SelectItem value="4:3">
                                        4:3 - 标准摄影
                                    </SelectItem>
                                    <SelectItem value="1:1">
                                        1:1 - 社交媒体方形
                                    </SelectItem>
                                    <SelectItem value="3:4">
                                        3:4 - 竖构图人像
                                    </SelectItem>
                                    <SelectItem value="9:16">
                                        9:16 - 手机壁纸
                                    </SelectItem>
                                    <SelectItem value="21:9">
                                        21:9 - 电影宽银幕
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-background/50">
                    <Button
                        className="w-full h-10 text-base font-medium transition-all"
                        onClick={handleGenerate}
                        disabled={loading}
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                生成中...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                立即生成
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 flex flex-col h-[calc(100vh-2rem)] pl-2">
                <div className="flex-1 bg-background/50 overflow-hidden flex flex-col relative rounded-lg border border-border">
                    {generatedImages.length === 0 && !loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/60">
                            <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 opacity-50" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-foreground/80">
                                等待创作灵感
                            </h3>
                            <p className="max-w-sm text-center text-sm leading-relaxed">
                                在左侧输入提示词，调整参数， 让 AI
                                为您绘制出想象中的画面
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {loading && (
                                    <div className="aspect-16/10 rounded-xl bg-muted/10 border border-dashed border-purple-200 flex flex-col items-center justify-center animate-pulse">
                                        <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
                                        <span className="text-sm text-purple-500 font-medium">
                                            绘制中...
                                        </span>
                                    </div>
                                )}
                                {generatedImages.map((img, index) => (
                                    <div
                                        key={index}
                                        className="group relative aspect-16/10 rounded-xl overflow-hidden bg-muted/50 border border-border/50 shadow-sm transition-all hover:shadow-xl hover:ring-2 hover:ring-purple-500/20"
                                    >
                                        <img
                                            src={img.url}
                                            alt={`Generated ${index}`}
                                            className="w-full h-full object-contain bg-black/5"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-between p-4">
                                            <div className="flex gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-black shadow-lg backdrop-blur-sm"
                                                    onClick={() =>
                                                        window.open(
                                                            img.url,
                                                            "_blank",
                                                        )
                                                    }
                                                    title="查看大图"
                                                >
                                                    <ImageIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-black shadow-lg backdrop-blur-sm"
                                                    asChild
                                                >
                                                    <a
                                                        href={img.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
