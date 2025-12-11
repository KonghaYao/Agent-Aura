"use client";

import React, {
    createContext,
    useContext,
    ReactNode,
    useEffect,
    useMemo,
} from "react";
import { UnionTool } from "@langgraph-js/sdk";
import { useChat } from "@langgraph-js/sdk/react";
import {
    update_plan,
    image_generation,
    think_tool,
    end_of_search,
} from "../tools/index";
import { create_artifacts } from "../tools/create_artifacts";
import { tavily_search_tool } from "../tools/tavily_search_tool";
import { tavily_extract_tool } from "../tools/tavily_extract_tool";
import { ask_user_with_options } from "../tools/steps/ask_user_with_options";
import { stop_for_human_approve } from "../tools/steps/stop_for_human_approve";

// 内置工具列表
const BUILTIN_TOOLS = [
    create_artifacts,
    update_plan,
    image_generation,
    tavily_search_tool,
    tavily_extract_tool,
    think_tool,
    end_of_search,
    ask_user_with_options,
    stop_for_human_approve,
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
