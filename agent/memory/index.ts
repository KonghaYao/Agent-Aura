import {
    AIMessage,
    HumanMessage,
    BaseMessage as Message,
    ToolMessage,
} from "@langchain/core/messages";

import { getMessageContent } from "@langgraph-js/sdk";
import MemoryClient, { Message as MemoryMessage } from "mem0ai";

export const memClient = new MemoryClient({ apiKey: process.env.MEM_TOKEN! });

export const getRelativeMemory = async (history: Message[], userId: string) => {
    const lastHumanMessage = excludeMemoryMessages(history).findLast(
        (i) => i.getType() === "human",
    )?.content;
    if (!lastHumanMessage) return [];
    const lastHumanMessageContent = getMessageContent(lastHumanMessage);
    const memory = await memClient.search(lastHumanMessageContent, {
        user_id: userId,
        keyword_search: true,
        top_k: 5,
        limit: 5,
    });

    // 将 memory 数据格式化为 XML + JSON stringify 格式
    const xmlContent = `<memory_data>
${memory
    .map(
        (item, index) => `  <memory_item index="${index}">
    <id>${item.id}</id>
    <memory>${item.memory || ""}</memory>
    <user_id>${item.user_id || ""}</user_id>
    <event>${item.event || ""}</event>
    <categories>${
        Array.isArray(item.categories) ? item.categories.join(", ") : ""
    }</categories>
    <created_at>${item.created_at || ""}</created_at>
    <updated_at>${item.updated_at || ""}</updated_at>
    <memory_type>${item.memory_type || ""}</memory_type>
    <score>${item.score || ""}</score>
    <hash>${item.hash || ""}</hash>
    <messages>${JSON.stringify(item.messages || [])}</messages>
    <metadata>${JSON.stringify(item.metadata || null)}</metadata>
  </memory_item>`,
    )
    .join("\n")}
</memory_data>`;

    return [
        {
            type: "ai",
            content: xmlContent,
            additional_kwargs: { is_memory: true },
        },
    ];
};

export const LCMessagesToMemoryMessages = (
    messages: Message[],
): MemoryMessage[] => {
    return excludeMemoryMessages(messages)
        .map((message) => {
            if (message.getType() === "human") {
                return {
                    role: "user",
                    content: getMessageContent(message.content),
                };
            }
            if (message.getType() === "ai") {
                if (message.content) {
                    return {
                        role: "assistant",
                        content: getMessageContent(message.content),
                    };
                } else {
                    return {
                        role: "assistant",
                        content: `input of tools: ${JSON.stringify(
                            (message as AIMessage).tool_calls,
                        )}`,
                    };
                }
            }
            if (message.getType() === "tool") {
                return {
                    role: "assistant",
                    content: `
output of ${message.name}: ${message.content}`,
                };
            }
            return null;
        })
        .filter(Boolean) as MemoryMessage[];
};
export const excludeMemoryMessages = (history: Message[]) => {
    return history.filter((message) => !message.additional_kwargs?.is_memory);
};
export const saveMemory = async (history: Message[], userId: string) => {
    const memoryHistory = LCMessagesToMemoryMessages(history);
    if (memoryHistory.length) {
        const response = await memClient.add(memoryHistory, {
            user_id: userId,
        });
        console.log("save memory ", response.length);
    }
    return excludeMemoryMessages(history);
};

export const wrapMemoryMessages = async (
    history: Message[],
    userId: string,
) => {
    const memory = await getRelativeMemory(history, userId);
    return [...history, ...memory] as Message[];
};
