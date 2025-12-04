"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    WhiteboardProps,
    TextElement,
    ImageElement,
    WhiteboardElement,
} from "../types";

export function Whiteboard({
    className,
    onMount,
    onTextChange,
    defaultFontSize = 16,
    defaultColor = "#000000",
}: WhiteboardProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [elements, setElements] = useState<WhiteboardElement[]>([]);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // 组件挂载时调用回调
    useEffect(() => {
        onMount?.();
    }, [onMount]);

    // 将文件转换为 base64
    const fileToBase64 = useCallback((file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }, []);

    // 添加图片元素
    const addImageElement = useCallback(
        async (file: File, x: number, y: number) => {
            try {
                const base64 = await fileToBase64(file);

                // 创建图片对象获取原始尺寸
                const img = new Image();
                img.onload = () => {
                    const maxWidth = 300;
                    const maxHeight = 300;
                    let width = img.width;
                    let height = img.height;

                    // 按比例缩放
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(
                            maxWidth / width,
                            maxHeight / height,
                        );
                        width *= ratio;
                        height *= ratio;
                    }

                    const newElement: ImageElement = {
                        id: `image-${Date.now()}`,
                        x,
                        y,
                        width,
                        height,
                        src: base64,
                        originalWidth: img.width,
                        originalHeight: img.height,
                    };

                    setElements((prev) => {
                        const updated = [...prev, newElement];
                        onTextChange?.(updated);
                        return updated;
                    });
                };
                img.src = base64;
            } catch (error) {
                console.error("Failed to process image:", error);
            }
        },
        [fileToBase64, onTextChange],
    );

    // 拖拽事件处理
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter((file) =>
                file.type.startsWith("image/"),
            );

            if (imageFiles.length > 0) {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    // 处理所有图片文件
                    let currentX = x;
                    let currentY = y;
                    for (const file of imageFiles) {
                        await addImageElement(file, currentX, currentY);
                        // 如果有多个文件，稍微错开位置
                        if (imageFiles.length > 1) {
                            currentX += 20;
                            currentY += 20;
                        }
                    }
                }
            }
        },
        [addImageElement],
    );

    // 开始拖拽
    const handleMouseDown = useCallback(
        (e: React.MouseEvent, element: WhiteboardElement, isResize = false) => {
            e.stopPropagation();
            setSelectedElement(element.id);

            if (isResize) {
                setIsResizing(true);
            } else {
                setIsDragging(true);
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setDragOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }
        },
        [],
    );

    const updateElement = useCallback(
        (id: string, updates: Partial<WhiteboardElement>) => {
            setElements((prev) => {
                const updated = prev.map((el) =>
                    el.id === id ? { ...el, ...updates } : el,
                );
                onTextChange?.(updated);
                return updated;
            });
        },
        [onTextChange],
    );

    // 鼠标移动处理
    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!selectedElement) return;

            const element = elements.find((el) => el.id === selectedElement);
            if (!element) return;

            if (isDragging) {
                // 拖拽移动
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                    const newX = e.clientX - rect.left - dragOffset.x;
                    const newY = e.clientY - rect.top - dragOffset.y;
                    updateElement(selectedElement, { x: newX, y: newY });
                }
            } else if (isResizing && !("text" in element)) {
                // 调整图片大小
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                    const newWidth = Math.max(
                        50,
                        e.clientX - rect.left - element.x,
                    );
                    const newHeight = Math.max(
                        50,
                        e.clientY - rect.top - element.y,
                    );
                    updateElement(selectedElement, {
                        width: newWidth,
                        height: newHeight,
                    });
                }
            }
        },
        [
            selectedElement,
            elements,
            isDragging,
            isResizing,
            dragOffset,
            updateElement,
        ],
    );

    // 结束拖拽或调整大小
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    const addTextElement = useCallback(
        (x: number, y: number) => {
            const newElement: TextElement = {
                id: `text-${Date.now()}`,
                x,
                y,
                text: "", // 初始为空，这样如果用户不输入就取消，会被删除
                width: 200,
                height: 50,
                fontSize: defaultFontSize,
                color: defaultColor,
            };
            setElements((prev) => {
                const updated = [...prev, newElement];
                onTextChange?.(updated);
                return updated;
            });
            setSelectedElement(newElement.id);
            setIsEditing(true);
        },
        [defaultFontSize, defaultColor, onTextChange],
    );

    const handleCanvasClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                addTextElement(x, y);
            }
        },
        [addTextElement],
    );

    const handleElementClick = useCallback(
        (e: React.MouseEvent, element: TextElement) => {
            e.stopPropagation();
            setSelectedElement(element.id);
            setIsEditing(true);
        },
        [],
    );

    const handleTextChange = useCallback(
        (id: string, newText: string) => {
            updateElement(id, { text: newText });
        },
        [updateElement],
    );

    const finishEditing = useCallback(
        (elementId: string) => {
            const element = elements.find((el) => el.id === elementId);
            if (element && "text" in element && element.text.trim() === "") {
                // 如果文本为空，删除该元素
                setElements((prev) => {
                    const updated = prev.filter((el) => el.id !== elementId);
                    onTextChange?.(updated);
                    return updated;
                });
            }
            setIsEditing(false);
            setSelectedElement(null);
        },
        [elements, onTextChange],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Escape" && selectedElement) {
                finishEditing(selectedElement);
            }
        },
        [selectedElement, finishEditing],
    );

    return (
        <div
            ref={canvasRef}
            className={`${className} relative bg-white cursor-text overflow-hidden`}
            onClick={handleCanvasClick}
            onKeyDown={handleKeyDown}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDrop={handleDrop}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            tabIndex={0}
        >
            {elements.map((element) => {
                if ("text" in element) {
                    // 文本元素
                    return (
                        <div
                            key={element.id}
                            className={`absolute ${
                                selectedElement === element.id
                                    ? "ring-2 ring-blue-500"
                                    : ""
                            }`}
                            style={{
                                left: element.x,
                                top: element.y,
                                minWidth: element.width,
                                minHeight: element.height,
                            }}
                            onClick={(e) => handleElementClick(e, element)}
                        >
                            {isEditing && selectedElement === element.id ? (
                                <textarea
                                    value={element.text}
                                    onChange={(e) =>
                                        handleTextChange(
                                            element.id,
                                            e.target.value,
                                        )
                                    }
                                    onBlur={() => finishEditing(element.id)}
                                    className="w-full h-full border-none outline-none bg-transparent resize-none font-sans"
                                    style={{
                                        fontSize: element.fontSize,
                                        color: element.color,
                                    }}
                                    placeholder="输入文本内容..."
                                    autoFocus
                                />
                            ) : (
                                <div
                                    className="w-full h-full p-2 whitespace-pre-wrap cursor-text"
                                    style={{
                                        fontSize: element.fontSize,
                                        color: element.color,
                                    }}
                                >
                                    {element.text || (
                                        <span className="text-gray-400 italic">
                                            点击编辑文本
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                } else {
                    // 图片元素
                    return (
                        <div
                            key={element.id}
                            className={`absolute ${
                                selectedElement === element.id
                                    ? "ring-2 ring-blue-500"
                                    : ""
                            } cursor-move`}
                            style={{
                                left: element.x,
                                top: element.y,
                                width: element.width,
                                height: element.height,
                            }}
                            onMouseDown={(e) => handleMouseDown(e, element)}
                        >
                            <img
                                src={element.src}
                                alt="Whiteboard image"
                                className="w-full h-full object-contain pointer-events-none"
                                draggable={false}
                            />
                            {/* 调整大小的控制点 */}
                            {selectedElement === element.id && (
                                <div
                                    className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                                    onMouseDown={(e) =>
                                        handleMouseDown(e, element, true)
                                    }
                                />
                            )}
                        </div>
                    );
                }
            })}

            {/* 提示文本 */}
            {elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                    点击空白处添加文本，或拖拽图片到此处
                </div>
            )}
        </div>
    );
}
