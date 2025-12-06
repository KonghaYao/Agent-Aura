import {
    AIMessage,
    BaseMessage,
    ContentBlock,
    ToolMessage,
} from "@langchain/core/messages";

export const getThreadId = (context: any) => {
    return context?.configurable?.thread_id as string;
};

export const getToolCallId = (context: any) => {
    return context?.toolCall?.id as string;
};

/**
 *  创建一对 toolCall 数据
 * @example
 * ```typescript
 * const [aiMessage, toolMessage] = createToolCall("toolName", { input: "input" }, "this is tool outputs");
 * ```
 */
export const createToolCall = (
    toolName: string,
    input: Record<string, any>,
    output?: string | (ContentBlock | ContentBlock.Text)[],
) => {
    const aiId = crypto.randomUUID();
    const toolCallId = crypto.randomUUID();
    return [
        new AIMessage({
            content: ``,
            id: aiId,
            tool_calls: [
                {
                    id: toolCallId,
                    name: toolName,
                    args: input,
                    type: "tool_call",
                },
            ],
        }),
        new ToolMessage({
            id: crypto.randomUUID(),
            content: output,
            tool_call_id: toolCallId,
            name: toolName,
        }),
    ] as const;
};

/** 合并两个 state，保证合并正确。messages 和 task_store 都会被合并 */
export const mergeState = <
    T extends { messages: BaseMessage[]; task_store?: Record<string, any> },
>(
    state: T,
    data: Partial<T>,
): T => {
    return {
        ...state,
        ...data,
        messages: [...state.messages, ...(data.messages || [])],
        task_store: {
            ...state.task_store,
            ...(data.task_store || {}),
        },
    };
};
