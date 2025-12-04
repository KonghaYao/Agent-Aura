// 白板应用相关的类型定义

export interface TextElement {
    id: string;
    x: number;
    y: number;
    text: string;
    width: number;
    height: number;
    fontSize: number;
    color: string;
}

export interface ImageElement {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    src: string; // base64 格式的图片数据
    originalWidth: number;
    originalHeight: number;
}

export type WhiteboardElement = TextElement | ImageElement;

export interface WhiteboardConfig {
    className?: string;
    defaultFontSize?: number;
    defaultColor?: string;
}

export interface WhiteboardProps extends WhiteboardConfig {
    config?: WhiteboardConfig;
    onMount?: () => void;
    onTextChange?: (elements: WhiteboardElement[]) => void;
    onImageChange?: (elements: WhiteboardElement[]) => void;
}
