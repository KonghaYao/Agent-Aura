"use client";

import React, { JSX, useState } from "react";
import {
    getMessageContent,
    type RenderMessage,
    type ToolMessage,
} from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
import { useChat } from "@langgraph-js/sdk/react";
import { Response } from "@/components/ai-elements/response";
import { MessagesBox } from "./MessageBox";
import { ChevronDown, ChevronRight, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const SubProcessViewer = ({ messages }: { messages: RenderMessage[] }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full mt-4">
            <CardHeader
                className="p-3 cursor-pointer hover:bg-muted/20 transition-colors flex flex-row items-center justify-between space-y-0 border rounded-2xl"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                        <Workflow className="h-4 w-4 text-blue-500" />
                        <span>Sub Process Execution</span>
                        <Badge
                            variant="secondary"
                            className="text-xs font-normal ml-2"
                        >
                            {messages.length} steps
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            {isOpen && (
                <div className="border-l border-gray-200 pl-2 ml-2">
                    <MessagesBox renderMessages={messages} />
                </div>
            )}
        </div>
    );
};

interface MessageToolProps {
    message: ToolMessage & RenderMessage;
}

const MessageTool: React.FC<MessageToolProps> = ({ message }) => {
    const { getToolUIRender } = useChat();
    const render = getToolUIRender(message.name!);
    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
        <div className="flex flex-col w-full mb-2">
            {render ? (
                (render(message) as JSX.Element)
            ) : (
                <div className="flex flex-col w-full bg-white rounded-lg border border-gray-200">
                    <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                            setIsCollapsed(!isCollapsed);
                        }}
                    >
                        <div
                            className="text-sm font-medium text-gray-700"
                            onClick={() => console.log(message)}
                        >
                            {message.name}
                        </div>
                    </div>

                    {isCollapsed && (
                        <div className="flex flex-col gap-4 p-4 border-t border-gray-100">
                            <Previewer content={message.tool_input || ""} />
                            <Previewer
                                content={getMessageContent(message.content)}
                            />
                            <UsageMetadata
                                response_metadata={
                                    message.response_metadata as any
                                }
                                usage_metadata={message.usage_metadata || {}}
                                spend_time={message.spend_time}
                                id={message.id}
                                tool_call_id={message.tool_call_id}
                            />
                        </div>
                    )}
                </div>
            )}
            {message.sub_messages && message.sub_messages.length > 0 && (
                <SubProcessViewer messages={message.sub_messages} />
            )}
        </div>
    );
};

const Previewer = ({ content }: { content: string }) => {
    const validJSON = () => {
        try {
            JSON.parse(content);
            return true;
        } catch (e) {
            return false;
        }
    };
    const isJSON =
        content.startsWith("{") && content.endsWith("}") && validJSON();
    const isMarkdown =
        content.includes("#") ||
        content.includes("```") ||
        content.includes("*");
    const [jsonMode, setJsonMode] = useState(false);
    const [markdownMode, setMarkdownMode] = useState(false);

    return (
        <div className={`flex flex-col`}>
            <div className="flex gap-2 mb-2">
                {isJSON && (
                    <button
                        onClick={() => setJsonMode(!jsonMode)}
                        className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                        json
                    </button>
                )}
                {isMarkdown && (
                    <button
                        onClick={() => setMarkdownMode(!markdownMode)}
                        className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                        markdown
                    </button>
                )}
            </div>

            <div className="flex flex-col max-h-[300px] overflow-auto border border-gray-200 rounded p-2 w-full text-xs font-mono whitespace-pre-wrap">
                {jsonMode && isJSON ? (
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(JSON.parse(content), null, 2)}
                    </pre>
                ) : markdownMode && isMarkdown ? (
                    <div className="markdown-body">
                        <Response>{content}</Response>
                    </div>
                ) : (
                    <pre className="whitespace-pre-wrap">{content}</pre>
                )}
            </div>
        </div>
    );
};

export default MessageTool;
