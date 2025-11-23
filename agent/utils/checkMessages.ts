import { AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import { Message } from "@langchain/langgraph-sdk";

class MessageCheck {
    constructor(public message: BaseMessage) {}
    isTool(name?: string) {
        return (
            ToolMessage.isInstance(this.message) &&
            (name ? this.message.name === name : true)
        );
    }
    isToolCallInvoked(tool_name: string) {
        return (
            AIMessage.isInstance(this.message) &&
            this.message?.tool_calls &&
            this.message.tool_calls.length > 0 &&
            this.message.tool_calls.some((i) => i.name === tool_name)
        );
    }
}

export const checkLastMessage = (messages: BaseMessage[]) => {
    if (messages.length === 0) {
        throw new Error("No messages to check");
    }
    const lastMessage = messages.at(-1)!;
    return new MessageCheck(lastMessage);
};

/** 从消息列表中获取最后一个满足条件的消息 */
export const getLastMessage = (
    messages: BaseMessage[],
    checkFn: (message: MessageCheck) => boolean,
) => {
    return messages.findLast((i) => checkFn(new MessageCheck(i)));
};
