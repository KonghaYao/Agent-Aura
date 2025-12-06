"use client";

import MessageHuman from "./MessageHuman";
import MessageAI from "./MessageAI";
import MessageTool from "./MessageTool";
import { type RenderMessage } from "@langgraph-js/sdk";
import { Message } from "@/src/components/ai-elements/message";

const transTypeToOpenAIType = (type: string) => {
    switch (type) {
        case "human":
            return "user";
        case "tool":
            return "assistant";
        case "ai":
            return "assistant";
    }
    return "assistant";
};

export const MessagesBox = ({
    renderMessages,
}: {
    renderMessages: RenderMessage[];
}) => {
    return (
        <>
            {renderMessages.map((message, index) => (
                <Message
                    key={message.id}
                    from={transTypeToOpenAIType(message.type)}
                >
                    {message.type === "human" ? (
                        <MessageHuman message={message}></MessageHuman>
                    ) : message.type === "tool" ? (
                        <MessageTool message={message}></MessageTool>
                    ) : (
                        <MessageAI message={message}></MessageAI>
                    )}
                </Message>
            ))}
        </>
    );
};
