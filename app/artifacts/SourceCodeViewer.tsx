"use client";
import { useEffect, useState } from "react";
import { useArtifacts } from "./ArtifactsContext";
import ShikiHighlighter from "react-shiki";
import "react-shiki/css"; // 导入默认样式，包括行号支持

// 文件扩展名到语言映射
const fileExtensionToLanguage: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    rb: "ruby",
    java: "java",
    go: "go",
    rs: "rust",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    php: "php",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    md: "markdown",
    sh: "bash",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    sql: "sql",
    // 添加更多映射...
};

// 根据文件名获取语言
const getLanguageFromFilename = (filename: string): string | undefined => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    return fileExtensionToLanguage[extension];
};

const filetypeToLanguage: Record<string, string> = {
    "application/javascript": "javascript",
    "application/typescript": "typescript",
    "application/json": "json",
    "application/xml": "xml",
    "application/yaml": "yaml",
    "application/vnd.ant.react": "tsx",
    "application/vnd.ant.mermaid": "mermaid",
    "application/vnd.ant.html": "html",
    "application/vnd.ant.css": "css",
    "application/vnd.ant.md": "markdown",
    "application/vnd.ant.sh": "bash",
};

const getLanguageFromFiletype = (filetype: string): string | undefined => {
    return filetypeToLanguage[filetype];
};

export const SourceCodeViewer: React.FC = () => {
    const { currentArtifact } = useArtifacts();

    if (!currentArtifact) {
        return (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                请选择一个文件
            </div>
        );
    }
    // 获取代码语言
    const language =
        getLanguageFromFilename(currentArtifact.filename) ||
        getLanguageFromFiletype(currentArtifact.filetype) ||
        currentArtifact.filetype;
    return (
        <div className="h-full w-full overflow-auto p-4">
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
                }}
            >
                {currentArtifact.code || ""}
            </ShikiHighlighter>
        </div>
    );
};
