import dynamic from "next/dynamic";

export interface QuickToolConfig {
    label: string;
    value: string;
    component: React.ComponentType; // 将 componentIdentifier 替换为 component
}

export const quickToolsConfig: QuickToolConfig[] = [
    {
        label: "翻译工具",
        value: "translate",
        component: dynamic(() => import("./translate/page")),
    },
    {
        label: "图片识别",
        value: "image-recognition",
        component: dynamic(() => import("./image-recognition/page")),
    },
];
