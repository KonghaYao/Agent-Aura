"use client";

import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import ShikiHighlighter, { isInlineCode } from "react-shiki";
import "react-shiki/css";

interface MarkdownRendererProps {
    content: string;
    className?: string;
    baseUrl?: string;
}

// 代码块渲染组件
const CodeBlock = ({ className, children, node, ...props }: any) => {
    // 提取语言信息
    const match = className?.match(/language-(\w+)/);
    const language = match ? match[1] : "text";
    const code = String(children).replace(/\n$/, "");

    // 检查是否为内联代码
    const isInline = node ? isInlineCode(node) : false;

    return !isInline ? (
        <ShikiHighlighter
            language={language}
            theme="github-light"
            showLineNumbers
            style={{
                // @ts-ignore - CSS 变量
                "--line-numbers-foreground": "rgba(107, 114, 128, 0.6)",
                "--line-numbers-width": "3ch",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                borderRadius: "0.5rem",
                marginBottom: "1.25rem",
            }}
        >
            {code}
        </ShikiHighlighter>
    ) : (
        <code
            className={`bg-gray-100 rounded-sm font-normal ${className}`}
            {...props}
        >
            {children}
        </code>
    );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
    baseUrl,
    content,
    className = "markdown-body max-w-none",
}) => {
    return (
        <div className={className}>
            <Markdown
                remarkPlugins={[remarkGfm, remarkFrontmatter]}
                components={{
                    code: CodeBlock,
                    img: (props) => {
                        if (!props.src) {
                            return null;
                        }
                        if (props.src instanceof Blob) {
                            return null;
                        }
                        let src = props.src;
                        if (!src.startsWith("http")) {
                            src = new URL(src, baseUrl).toString();
                        }
                        return (
                            <img
                                {...props}
                                src={"/api/image-cdn?url=" + props.src}
                                className="rounded-md"
                            />
                        );
                    },
                }}
            >
                {content}
            </Markdown>
        </div>
    );
};
