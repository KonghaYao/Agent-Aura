# 白板应用 (Whiteboard)

专注于文本编辑的轻量级白板应用组件。

## 功能特性

-   📝 点击添加文本元素
-   🖼️ 拖拽图片到画布
-   ✏️ 即时文本编辑
-   🎨 可配置字体大小和颜色
-   📏 拖拽调整元素位置
-   🔄 调整图片大小
-   ⌨️ 键盘快捷键支持 (ESC 退出编辑)
-   🎯 TypeScript 支持
-   📱 响应式设计
-   🔄 实时状态同步

## 基本使用

```tsx
import { Whiteboard } from "./app/whiteboard";

function App() {
    return (
        <div className="h-screen">
            <Whiteboard
                className="h-full w-full"
                defaultFontSize={16}
                defaultColor="#333333"
                onMount={() => {
                    console.log("白板已加载");
                }}
                onTextChange={(elements) => {
                    console.log("文本元素变化", elements);
                }}
            />
        </div>
    );
}
```

## 配置选项

```tsx
interface WhiteboardConfig {
    className?: string; // CSS 类名
    defaultFontSize?: number; // 默认字体大小
    defaultColor?: string; // 默认文字颜色
}

interface WhiteboardProps extends WhiteboardConfig {
    config?: WhiteboardConfig;
    onMount?: () => void; // 白板加载完成回调
    onTextChange?: (elements: TextElement[]) => void; // 文本元素变化回调
}

interface TextElement {
    id: string; // 元素唯一标识
    x: number; // X 坐标
    y: number; // Y 坐标
    text: string; // 文本内容
    width: number; // 元素宽度
    height: number; // 元素高度
    fontSize: number; // 字体大小
    color: string; // 文字颜色
}
```

## 操作说明

1. **添加文本**: 点击空白区域添加新的文本元素（初始为空）
2. **添加图片**: 将图片文件拖拽到画布中即可添加
3. **编辑文本**: 点击已有的文本元素进入编辑模式
4. **移动元素**: 鼠标拖拽元素来调整位置
5. **调整图片大小**: 选中图片后拖拽右下角的控制点调整大小
6. **退出编辑**: 按 ESC 键或点击其他区域退出编辑
7. **智能清理**: 如果新创建的文本元素没有输入内容，退出编辑时会自动删除
8. **实时同步**: 元素变化会通过 `onTextChange` 回调通知

## 文件结构

```plaintext
whiteboard/
├── components/
│   └── Whiteboard.tsx     # 主要白板组件
├── page.tsx               # 白板页面
├── types.ts               # 类型定义
├── index.ts               # 导出文件
└── README.md              # 说明文档
```
