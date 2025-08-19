"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { quickToolsConfig, QuickToolConfig } from "./config"; // 导入 QuickToolConfig 类型
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function QuickToolsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState("");
    const [ActiveTabComponent, setActiveTabComponent] =
        useState<React.ComponentType | null>(null);

    useEffect(() => {
        const tab = searchParams.get("tab");
        const configItem = quickToolsConfig.find(
            (item: QuickToolConfig) => item.value === tab,
        );

        if (configItem) {
            setActiveTab(configItem.value);
            setActiveTabComponent(() => configItem.component);
        } else if (quickToolsConfig.length > 0) {
            const defaultTab = quickToolsConfig[0];
            setActiveTab(defaultTab.value);
            router.replace(`?tab=${defaultTab.value}`);
            setActiveTabComponent(() => defaultTab.component);
        }
    }, [searchParams, router]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        router.push(`?tab=${value}`);
        const configItem = quickToolsConfig.find(
            (item: QuickToolConfig) => item.value === value,
        );
        if (configItem) {
            setActiveTabComponent(() => configItem.component);
        }
    };

    if (!activeTab || !ActiveTabComponent) {
        return null; // 或者显示加载状态
    }

    return (
        <div className="w-full p-8 h-full">
            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full h-full"
            >
                <TabsList className="grid w-full grid-cols-2">
                    {quickToolsConfig.map((item: QuickToolConfig) => (
                        <TabsTrigger key={item.value} value={item.value}>
                            {item.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {quickToolsConfig.map((item: QuickToolConfig) => (
                    <TabsContent key={item.value} value={item.value}>
                        {ActiveTabComponent ? <ActiveTabComponent /> : null}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
