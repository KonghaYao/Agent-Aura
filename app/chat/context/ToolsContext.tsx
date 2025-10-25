"use client";

import React, {
    createContext,
    useContext,
    ReactNode,
    useEffect,
    useState,
    useMemo,
    useRef,
    useCallback,
} from "react";
import { UnionTool } from "@langgraph-js/sdk";
import { useChat } from "@langgraph-js/sdk/react";
import {
    update_plan,
    web_search_tool,
    read_web_page_tool,
    image_generation,
} from "../tools/index";
import { create_artifacts } from "../tools/create_artifacts";

// 内置工具列表
const BUILTIN_TOOLS = [
    create_artifacts,
    web_search_tool,
    update_plan,
    read_web_page_tool,
    image_generation,
];

interface ToolsContextType {
    builtinTools: UnionTool<any, any, any>[];
    allTools: UnionTool<any, any, any>[];
}

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

export const useTools = () => {
    const context = useContext(ToolsContext);
    if (context === undefined) {
        throw new Error("useTools must be used within a ToolsProvider");
    }
    return context;
};

interface ToolsProviderProps {
    children: ReactNode;
}

export const ToolsProvider: React.FC<ToolsProviderProps> = ({ children }) => {
    const { setTools } = useChat();

    // 从 localStorage 获取初始配置
    const getInitialConfig = () => {
        if (typeof window === "undefined") return {};
        try {
            const stored = localStorage.getItem("mcpConfig");
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    };

    // 内置工具保持不变
    const builtinTools = useMemo(() => BUILTIN_TOOLS, []);

    // 合并所有工具
    const allTools = useMemo(() => {
        return [...builtinTools];
    }, [builtinTools]);

    // 当所有工具变化时，同步更新 chat 状态
    useEffect(() => {
        if (setTools) {
            console.log("更新 chat 工具:", allTools.length);
            setTools(allTools);
        }
    }, [allTools, setTools]);

    const value: ToolsContextType = {
        builtinTools,
        allTools,
    };

    return (
        <ToolsContext.Provider value={value}>{children}</ToolsContext.Provider>
    );
};
