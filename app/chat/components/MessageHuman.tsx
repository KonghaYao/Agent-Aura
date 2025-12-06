"use client";

import { RenderMessage } from "@langgraph-js/sdk";
import React, { memo } from "react";
import {
    MessageAction,
    MessageActions,
    MessageAttachment,
    MessageAttachments,
    MessageContent,
    MessageResponse,
    MessageToolbar,
} from "@/components/ai-elements/message";
import { FileUIPart } from "ai";
import { getMimeTypeFromUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CopyIcon, RefreshCcw, RefreshCcwIcon } from "lucide-react";
import { useChat } from "@langgraph-js/sdk/react";
import { useExtraParams } from "../context/ExtraParamsContext";

interface MessageHumanProps {
    message: RenderMessage;
}

const MessageHuman: React.FC<MessageHumanProps> = ({ message }) => {
    const { revertChatTo } = useChat();
    const { extraParams } = useExtraParams();
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
        <div className="group">
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
            <MessageToolbar>
                <div className="flex-1"></div>
                <MessageActions className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageAction
                        label="Retry"
                        onClick={() => {
                            revertChatTo(message.id!, true, {
                                extraParams,
                            });
                        }}
                    >
                        <RefreshCcwIcon className="size-4" />
                    </MessageAction>
                    <MessageAction label="Copy">
                        <CopyIcon className="size-4" />
                    </MessageAction>
                </MessageActions>
            </MessageToolbar>
        </div>
    );
};

export default MessageHuman;
