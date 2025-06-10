"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface Message {
    role: "user" | "backend";
    content: string;
}

export default function CommunicationPage() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [tab, setTab] = useState("chat");

    // 模拟后端回复
    const handleSend = () => {
        if (!input.trim()) return;
        setMessages((msgs) => [
            ...msgs,
            { role: "user", content: input },
            { role: "backend", content: `后端回复：${input}` },
        ]);
        setInput("");
    };

    return (
        <div className="max-w-xl mx-auto py-10 flex flex-col gap-6">
            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="chat">沟通</TabsTrigger>
                    <TabsTrigger value="history">历史</TabsTrigger>
                </TabsList>
                <TabsContent value="chat">
                    <div className="flex flex-col gap-4">
                        <div className="flex-1 min-h-[200px] border rounded-md p-4 bg-background flex flex-col gap-2 overflow-y-auto">
                            {messages.length === 0 ? (
                                <div className="text-muted-foreground text-center">
                                    暂无消息
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${
                                            msg.role === "user"
                                                ? "justify-end"
                                                : "justify-start"
                                        }`}>
                                        <div
                                            className={`px-3 py-2 rounded-md text-sm max-w-[70%] ${
                                                msg.role === "user"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex gap-2 items-end">
                            <Textarea
                                className="flex-1 resize-none"
                                rows={2}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="请输入消息..."
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleSend}
                                className="h-10 px-6"
                                type="button">
                                发送
                            </Button>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="history">
                    <div className="text-muted-foreground text-center py-10">
                        暂无历史记录
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
