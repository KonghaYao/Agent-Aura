// 预览类型枚举
export enum PreviewType {
    IFRAME = "iframe",
    CODE = "code",
    MARKDOWN = "markdown",
    NONE = "none",
}

// 预览配置接口
export interface PreviewConfig {
    type: PreviewType;
    description?: string;
}

// 文件类型到预览配置的映射
export const fileTypeToPreviewConfig: Record<string, PreviewConfig> = {
    // React 应用
    "application/vnd.ant.react": {
        type: PreviewType.IFRAME,
        description: "React 应用预览",
    },

    // HTML 文件
    "text/html": {
        type: PreviewType.IFRAME,
        description: "HTML 预览",
    },

    // Markdown 文件
    "text/markdown": {
        type: PreviewType.MARKDOWN,
        description: "Markdown 预览",
    },

    // 默认为代码预览
    default: {
        type: PreviewType.CODE,
        description: "代码预览",
    },
};

// 根据文件类型获取预览配置
export const getPreviewConfig = (fileType: string): PreviewConfig => {
    return fileTypeToPreviewConfig[fileType] || fileTypeToPreviewConfig.default;
};
