import {
    AIMessage,
    HumanMessage,
    BaseMessage as Message,
    ToolMessage,
} from "@langchain/core/messages";

import { getMessageContent } from "@langgraph-js/sdk";
import MemoryClient, { Message as MemoryMessage } from "mem0ai";

const getCurrentDate = () => new Date().toISOString().split("T")[0];
const getDateDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
};

export const memClient = new MemoryClient({ apiKey: process.env.MEM_TOKEN! });

export const memoryToXML = (memory: any[]): string => {
    const xmlContent = `<memory_data>
${memory
    .map(
        (item, index) => `  <memory_item index="${index}">
    <id>${item.id || ""}</id>
    <memory>${item.memory || ""}</memory>
    <event>${item.event || ""}</event>
    <created_at>${item.created_at || ""}</created_at>
    <updated_at>${item.updated_at || ""}</updated_at>
  </memory_item>`,
    )
    .join("\n")}
</memory_data>`;
    return xmlContent;
};

export const getRelativeMemory = async (history: Message[], context: any) => {
    const humanMessages = excludeMemoryMessages(history).filter(
        (msg) => msg.getType() === "human",
    );
    if (!humanMessages.length) return [];

    const lastHumanMessageContent = getMessageContent(
        humanMessages[humanMessages.length - 1].content,
    );
    if (!lastHumanMessageContent) return [];

    const memory = await memClient.search(lastHumanMessageContent, {
        user_id: context?.configurable?.userId,
        keyword_search: true,
        top_k: 5,
        limit: 5,
        // agent_id: context?.metadata?.graph_id,
        enable_graph: true,
    });

    // 将 memory 数据格式化为 XML 格式
    const xmlContent = memoryToXML(memory);

    return [
        new AIMessage({
            content: xmlContent,
            additional_kwargs: { is_memory: true },
        }),
    ];
};

export const LCMessagesToMemoryMessages = (
    messages: Message[],
): MemoryMessage[] => {
    const result: MemoryMessage[] = [];
    for (const message of excludeMemoryMessages(messages)) {
        if (message.getType() === "human") {
            result.push({
                role: "user",
                content: getMessageContent(message.content),
            });
        } else if (message.getType() === "ai") {
            const content = getMessageContent(message.content);
            if (content) {
                result.push({
                    role: "assistant",
                    content: content,
                });
            } else {
                // 处理工具调用
                if (
                    message instanceof AIMessage &&
                    message.tool_calls &&
                    message.tool_calls.length > 0
                ) {
                    result.push({
                        role: "assistant",
                        content: `input of tools: ${JSON.stringify(
                            message.tool_calls,
                        )}`,
                    });
                }
            }
        } else if (message.getType() === "tool") {
            result.push({
                role: "assistant",
                content: `output of ${
                    (message as ToolMessage).name || ""
                }: ${getMessageContent(message.content)}`,
            });
        }
    }
    return result;
};
export const excludeMemoryMessages = (history: Message[]) => {
    return history.filter((message) => !message.additional_kwargs?.is_memory);
};
export const saveMemory = async (
    history: Message[],
    context: any,
    options?: { waitForResponse: boolean },
) => {
    const memoryHistory = LCMessagesToMemoryMessages(history);
    if (memoryHistory.length) {
        const response = memClient
            .add(memoryHistory, {
                user_id: context?.configurable?.userId,
                agent_id: context?.configurable?.graph_id,
                // run_id: context?.metadata?.run_id,
                enable_graph: true,
            })
            .then((response) => {
                console.log(`save memory ${response.length}`);
            });
        if (options?.waitForResponse) {
            await response;
        }
    }
    return excludeMemoryMessages(history);
};

export const wrapMemoryMessages = async (history: Message[], context: any) => {
    const memory = await getRelativeMemory(history, context);
    return [...history, ...memory] as Message[];
};

export const getBackgroundMemory = async (context: any): Promise<Message[]> => {
    const preferenceTask = getUserPreferenceMemory(context);
    const workingTask = getWorkingMemory(context);
    const [preference, working] = await Promise.all([
        preferenceTask,
        workingTask,
    ]);
    return [...preference, ...working];
};

export const getUserPreferenceMemory = async (
    context: any,
): Promise<Message[]> => {
    const endTime = getCurrentDate();
    const createTime = getDateDaysAgo(3);
    const filters = {
        user_id: context?.configurable?.userId,
        AND: [
            {
                created_at: {
                    gte: createTime,
                    lte: endTime,
                },
            },
            {
                categories: {
                    in: ["user_preferences"],
                },
            },
        ],
    };
    const result = await memClient.getAll({
        page_size: 5,
        version: "v2",
        filters,
        user_id: context?.configurable?.userId,
    });
    return [
        new AIMessage({
            content: memoryToXML(result),
            additional_kwargs: { is_memory: true },
        }),
    ];
};

export const getWorkingMemory = async (context: any): Promise<Message[]> => {
    const endTime = getCurrentDate();
    const createTime = getDateDaysAgo(3);
    const filters = {
        user_id: context?.configurable?.userId,
        agent_id: context?.configurable?.graph_id,
        AND: [
            {
                created_at: {
                    gte: createTime,
                    lte: endTime,
                },
            },
            // {
            //     categories: {
            //         in: ["user_preferences"],
            //     },
            // },
        ],
    };
    const result = await memClient.getAll({
        page_size: 5,
        version: "v2",
        user_id: context?.configurable?.userId,
        agent_id: context?.configurable?.graph_id,
        filters,
    });
    return [
        new AIMessage({
            content: memoryToXML(result),
            additional_kwargs: { is_memory: true },
        }),
    ];
};
