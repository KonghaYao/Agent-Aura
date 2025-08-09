import { entrypoint } from "@langchain/langgraph";
import {
    createReactAgent,
    type CreateReactAgentParams,
} from "@langchain/langgraph/prebuilt";
import { MessagesAnnotation } from "@langchain/langgraph";
import {
    AIMessage,
    BaseMessage,
    SystemMessage,
} from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { MEMORY_PROMPT_TEMPLATE, MemorySchema } from "./prompt";

interface MemoryMessage extends AIMessage {
    isMemory: true;
}

const createMemoryMessage = (m: AIMessage) => {
    m.id = m.id || crypto.randomUUID();
    /** @ts-ignore */
    m.additional_kwargs.isMemory = true;
    return m;
};
const isMemoryMessage = (m: BaseMessage) => {
    /** @ts-ignore */
    return m.additional_kwargs?.isMemory;
};

export class MultipleToOneMap<V extends BaseMessage> {
    private idMap = new Map<string, string>();
    private map = new Map<string, V>();
    set(key: string, value: V) {
        this.idMap.set(key, value.id!);
        this.map.set(value.id!, value);
    }
    get(key: string) {
        return this.map.get(this.idMap.get(key)!);
    }
}

export class MemoryBase {
    MessageIdToMemoryMap = new MultipleToOneMap<MemoryMessage>();
    private systemPrompt: string;
    constructor(
        private llm: BaseChatModel,
        promptOptions: { additionalRequirements?: string } = {},
    ) {
        this.systemPrompt = MEMORY_PROMPT_TEMPLATE(promptOptions);
    }
    async replaceMessagesWithMemory(messages: BaseMessage[]) {
        const messageWithMemory: BaseMessage[] = [];
        let lastMemory: MemoryMessage | null = null;
        for (const message of messages) {
            if (isMemoryMessage(message)) {
                continue;
            }
            if (
                /** @ts-ignore */
                message.type !== "system"
            ) {
                const id = message.id!;
                const memory = this.MessageIdToMemoryMap.get(id);
                if (memory) {
                    // 如果上一个记忆相同，则忽略
                    if (lastMemory !== memory) {
                        messageWithMemory.push(memory);
                        lastMemory = memory;
                    }
                } else {
                    messageWithMemory.push(message);
                }
            } else {
                messageWithMemory.push(message);
            }
        }
        return messageWithMemory;
    }
    private async createMemoryFromMessages(messages: BaseMessage[]) {
        const memory = await this.llm
            .withStructuredOutput(MemorySchema)
            .invoke([
                new SystemMessage(this.systemPrompt),
                ...messages,
                new AIMessage("现在我要开始总结上面的对话了"),
            ]);
        return createMemoryMessage(
            new AIMessage(JSON.stringify(memory, null, 2)),
        );
    }
    async setIntoMemory(messages: BaseMessage[]) {
        const memory = await this.createMemoryFromMessages(messages);
        messages.forEach((message) => {
            if (message.getType() !== "system") {
                const id = message.id!;
                this.MessageIdToMemoryMap.set(id, memory as MemoryMessage);
            }
        });
        return memory;
    }
}

export const createMemoryAgent = <T extends typeof MessagesAnnotation.State>(
    agentInit: CreateReactAgentParams & {
        memory: MemoryBase;
    },
) =>
    entrypoint(agentInit.name ?? "memory_agent", async (state: T) => {
        const agent = createReactAgent(agentInit);
        const messages = await agentInit.memory.replaceMessagesWithMemory(
            state.messages,
        );
        const agentResponse = await agent.invoke({
            messages,
        });
        await agentInit.memory.setIntoMemory(agentResponse.messages);
        return { messages: agentResponse.messages };
    });
