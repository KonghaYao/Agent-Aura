import { AIMessage, BaseMessage as Message } from "@langchain/core/messages";
import { RemoteMemoryDatabase } from "@langgraph-js/memory/client";
import { getMessageContent } from "@langgraph-js/sdk";

const memoryDB = new RemoteMemoryDatabase(
    "https://langgraph-memory.konghayao.deno.net/",
    process.env.MEMORY_MASTER_KEY,
);
const getCurrentDate = () => new Date().toISOString().split("T")[0];
const getDateDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
};

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

    const memory = await memoryDB.search(lastHumanMessageContent, {
        userId: context?.configurable?.userId,
    });

    // 将 memory 数据格式化为 XML 格式
    const xmlContent = memoryToXML(memory.results);

    return [
        new AIMessage({
            content: xmlContent,
            additional_kwargs: { is_memory: true },
        }),
    ];
};

export const excludeMemoryMessages = (history: Message[]) => {
    return history.filter((message) => !message.additional_kwargs?.is_memory);
};
export const saveMemory = async (
    history: Message[],
    context: any,
    options?: { waitForResponse: boolean },
) => {
    if (history.length) {
        const response = memoryDB
            .add(history, {
                userId: context?.configurable?.userId,
                agentId: context?.configurable?.graph_id,
            })
            .then((response) => {
                console.log(`save memory ${response.results.length}`);
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
    const result = await memoryDB.getAll({
        limit: 5,
        filters: {
            categories: ["user_preferences"],
        },
        userId: context?.configurable?.userId,
    });
    return [
        new AIMessage({
            content: memoryToXML(result.results),
            additional_kwargs: { is_memory: true },
        }),
    ];
};

export const getWorkingMemory = async (context: any): Promise<Message[]> => {
    const endTime = getCurrentDate();
    const createTime = getDateDaysAgo(3);
    const result = await memoryDB.getAll({
        limit: 5,
        userId: context?.configurable?.userId,
        agentId: context?.configurable?.graph_id,
        filters: {
            updatedAtBefore: endTime,
            updatedAtAfter: createTime,
        },
    });
    return [
        new AIMessage({
            content: memoryToXML(result.results),
            additional_kwargs: { is_memory: true },
        }),
    ];
};
