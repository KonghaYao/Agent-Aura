"use client";

import React from "react";
import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";
import { Settings, MessageSquare, History, Home, Users } from "lucide-react";
import sidebarConfig from "./config/sidebar.json";
import AnimatedBackground from "../components/AnimatedBackground";

interface SidebarConfig {
    title: string;
    items: {
        title: string;
        icon: string;
        url?: string;
        onClick?: string;
    }[];
}

const iconMap = {
    MessageSquare,
    History,
    Settings,
    Home,
    Users,
};

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const config = sidebarConfig as SidebarConfig;

    const handleItemClick = (item: SidebarConfig["items"][0]) => {
        if (item.url) {
            window.location.href = item.url;
        } else if (item.onClick) {
            // 这里可以添加自定义的点击处理逻辑
            console.log("执行操作:", item.onClick);
            if (item.onClick === "toggleHistory") {
                // 可以通过 context 或其他方式与聊天组件通信
                // 暂时通过 window 事件来通信
                window.dispatchEvent(new CustomEvent("toggleHistory"));
            }
        }
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar className="border-r">
                    <SidebarHeader className="px-4 py-6">
                        <div className="flex">
                            <h1
                                className="text-4xl font-bold tracking-tight"
                                style={{
                                    writingMode: "sideways-rl",
                                }}
                            >
                                {config.title}
                            </h1>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {config.items.map((item, index) => {
                                        const IconComponent =
                                            iconMap[
                                                item.icon as keyof typeof iconMap
                                            ] || Settings;

                                        return (
                                            <SidebarMenuItem key={index}>
                                                <SidebarMenuButton
                                                    onClick={() =>
                                                        handleItemClick(item)
                                                    }
                                                    className="w-full justify-start hover:bg-gray-200 cursor-pointer transition-colors"
                                                >
                                                    <IconComponent className="h-5 w-5" />
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>

                <SidebarInset className="flex-1 flex flex-col overflow-hidden h-screen">
                    <main className="flex-1 overflow-hidden">{children}</main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
