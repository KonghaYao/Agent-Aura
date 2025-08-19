import { useState } from "react";
// import { ChatResponse } from "@/hooks/api"; // 不再直接使用 ChatResponse
import { models } from "@/app/chat/config/models";

export interface Message {
    type: "human" | "system";
    content:
        | string
        | (
              | { type: "text"; text: string }
              | { type: "image_url"; image_url: { url: string } }
          )[];
}

export function useChatModel(config?: { model: string }): {
    selectedModel: string;
    setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
    mainModels: string[];
    sendMessages: (messages: Message[]) => AsyncGenerator<string>; // 明确指定返回类型，重命名为 sendMessages
} {
    const [selectedModel, setSelectedModel] = useState(
        config?.model || models.main_model[0],
    );

    const sendMessages = async function* (
        messages: Message[],
    ): AsyncGenerator<string> {
        // 重命名为 sendMessages
        try {
            const response = await fetch(
                process.env.NEXT_PUBLIC_LANGGRAPH_API_URL! +
                    "/llm/response-with-messages",
                {
                    method: "POST",
                    body: JSON.stringify({ model: selectedModel, messages }),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization:
                            `Bearer ` + localStorage.getItem("token"),
                    },
                },
            );

            if (!response.body) return;

            const reader = response.body
                .pipeThrough(new TextDecoderStream())
                .getReader();
            let result = await reader.read();
            for (; !result.done; result = await reader.read()) {
                if (result.value) yield result.value;
            }
            reader.releaseLock();
        } catch (error) {
            console.error("Error sending messages to LLM:", error);
            throw error; // Rethrow to be caught by the calling component
        }
    };

    return {
        selectedModel,
        setSelectedModel,
        mainModels: models.main_model,
        sendMessages,
    };
}
