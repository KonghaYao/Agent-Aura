"use client";

import { RenderMessage } from "@langgraph-js/sdk";
import React, { memo } from "react";
import {
    MessageAttachment,
    MessageAttachments,
    MessageContent,
    MessageResponse,
} from "@/src/components/ai-elements/message";
import { FileUIPart } from "ai";
import { getMimeTypeFromUrl } from "@/lib/utils";

interface MessageHumanProps {
    message: RenderMessage;
}

const MessageHuman: React.FC<MessageHumanProps> = ({ message }) => {
    const content: {
        text: string;
        attachments: FileUIPart[];
    } = (() => {
        if (typeof message.content === "string") {
            return {
                text: message.content,
                attachments: [],
            };
        } else {
            return {
                text: message.content
                    .filter((i) => i.type === "text")
                    .map((i) => i.text)
                    .join(""),
                attachments: message.content
                    .filter((i) => i.type !== "text")
                    .map((i) => {
                        /** @ts-ignore */
                        const url = i[i.type]["url"];
                        return {
                            type: "file",
                            mediaType: getMimeTypeFromUrl(url),
                            url,
                        };
                    }),
            };
        }
    })();

    return (
        <div>
            {content.attachments && content.attachments.length > 0 && (
                <MessageAttachments className="mb-2">
                    {content.attachments.map((attachment) => (
                        <MessageAttachment
                            data={attachment}
                            key={attachment.url}
                        />
                    ))}
                </MessageAttachments>
            )}
            <MessageContent>
                <MessageResponse>{content.text}</MessageResponse>
            </MessageContent>
        </div>
    );
};

export default MessageHuman;
