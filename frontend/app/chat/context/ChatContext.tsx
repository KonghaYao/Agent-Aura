"use client";

import React, {
    createContext,
    useContext,
    ReactNode,
    useEffect,
    useMemo,
} from "react";
import { createChatStore, UnionStore, useUnionStore } from "@langgraph-js/sdk";
import { useStore } from "@nanostores/react";
import {
    ask_user_for_approve,
    update_plan,
    web_search_tool,
    read_web_page_tool,
} from "../tools/index";
import { create_artifacts } from "../tools/create_artifacts";

// 创建 store 工厂函数
const createGlobalChatStore = () =>
    createChatStore(
        process.env.NEXT_PUBLIC_AGENT_NAME || "",
        {
            apiUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL,
            defaultHeaders: {},
            callerOptions: {
                // 携带 cookie 的写法
                // fetch: (url: string, options: RequestInit) => {
                //     options.credentials = "include";
                //     return fetch(url, options);
                // },
            },
        },
        {
            onInit(client) {
                client.tools.bindTools([
                    create_artifacts,
                    web_search_tool,
                    ask_user_for_approve,
                    update_plan,
                    read_web_page_tool,
                ]);
            },
        },
    );

type ChatContextType = UnionStore<ReturnType<typeof createGlobalChatStore>>;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const globalChatStore = useMemo(() => createGlobalChatStore(), []);

    const store = useUnionStore(globalChatStore, useStore);

    useEffect(() => {
        store
            .initClient()
            .then((res) => {
                if (store.showHistory) {
                    store.refreshHistoryList();
                }
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    return (
        <ChatContext.Provider value={store}>{children}</ChatContext.Provider>
    );
};
