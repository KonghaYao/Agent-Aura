"use client";

import MessageHuman from "./MessageHuman";
import MessageAI from "./MessageAI";
import MessageTool from "./MessageTool";
import { type RenderMessage } from "@langgraph-js/sdk";
import { Message } from "@/components/ai-elements/message";

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
    parent_id = "",
}: {
    renderMessages: RenderMessage[];
    parent_id?: string;
}) => {
    return (
        <>
            {renderMessages
                .filter((i) => i.unique_id)
                .map((message, index) => (
                    <Message
                        from={transTypeToOpenAIType(message.type)}
                        key={
                            parent_id +
                            (message.unique_id || crypto.randomUUID())
                        }
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
