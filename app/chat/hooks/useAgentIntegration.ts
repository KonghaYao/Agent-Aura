import { useAgentConfig } from "../context/AgentConfig";
import { useEffect } from "react";

/**
 * Hook 用于在聊天中集成 Agent 配置
 * 当 Agent 切换时，可以自动应用新的配置
 */
export function useAgentIntegration() {
    const { currentAgent } = useAgentConfig();

    useEffect(() => {
        if (currentAgent) {
            console.log("Agent changed:", currentAgent.name);
            // 这里可以添加切换 Agent 时的逻辑
            // 例如：重置聊天历史、更新系统提示词等
        }
    }, [currentAgent]);

    // 获取当前 Agent 的系统提示词
    const getSystemPrompt = () => {
        return currentAgent?.systemPrompt || "";
    };

    // 获取当前 Agent 的模型配置
    const getModelConfig = () => {
        return currentAgent?.llm?.[0]?.model || "gpt-4";
    };

    // 获取当前 Agent 的工具列表
    const getTools = () => {
        return currentAgent?.tools || [];
    };

    // 检查是否启用了 Agent
    const isAgentEnabled = () => {
        return currentAgent !== null;
    };

    return {
        currentAgent,
        getSystemPrompt,
        getModelConfig,
        getTools,
        isAgentEnabled,
    };
}
