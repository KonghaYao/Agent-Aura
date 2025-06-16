"use client";

import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    ReactNode,
} from "react";
import { useChat } from "./ChatContext";
import { useLocalStorage } from "usehooks-ts";

interface ExtraParamsContextType {
    extraParams: Record<string, any>;
    setExtraParams: (params: Record<string, any>) => void;
}

const ExtraParamsContext = createContext<ExtraParamsContextType>({
    extraParams: {},
    setExtraParams: () => {},
});

export const useExtraParams = () => useContext(ExtraParamsContext);

interface ExtraParamsProviderProps {
    children: ReactNode;
}

export const ExtraParamsProvider: React.FC<ExtraParamsProviderProps> = ({
    children,
}) => {
    const chat = useChat();
    const [extraParams, setExtraParams] = useLocalStorage<Record<string, any>>(
        "extraParams",
        {
            main_model: "gpt-4.1-mini",
        },
    );

    useEffect(() => {
        localStorage.setItem("extraParams", JSON.stringify(extraParams));
        if (chat.client) {
            chat.client.extraParams = extraParams;
        }
    }, [extraParams, chat.client]);

    // 同步客户端启动后的状态
    useEffect(() => {
        if (chat.client && Object.keys(extraParams).length > 0) {
            chat.client.extraParams = extraParams;
        }
    }, [chat.client]);

    return (
        <ExtraParamsContext.Provider value={{ extraParams, setExtraParams }}>
            {children}
        </ExtraParamsContext.Provider>
    );
};
