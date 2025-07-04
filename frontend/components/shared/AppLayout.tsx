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
import {
    Settings,
    MessageSquare,
    Home,
    Users,
    BookOpen,
    Globe,
} from "lucide-react";

const iconMap = {
    MessageSquare,
    Settings,
    Home,
    Users,
    BookOpen,
    Globe,
};

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AppLayout({
    children,
    title = "Aura",
}: AppLayoutProps) {
    const menuItems = [
        {
            title: "聊天",
            icon: "MessageSquare",
            url: "/chat",
        },
        {
            title: "备忘录",
            icon: "BookOpen",
            url: "/memos",
        },
        {
            title: "网页搜索",
            icon: "Globe",
            url: "/web-search",
        },
    ];

    const handleItemClick = (item: (typeof menuItems)[0]) => {
        if (item.url) {
            window.location.href = item.url;
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
                                {title}
                            </h1>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {menuItems.map((item, index) => {
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
