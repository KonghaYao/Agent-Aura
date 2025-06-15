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
            async onInit(client) {},
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
