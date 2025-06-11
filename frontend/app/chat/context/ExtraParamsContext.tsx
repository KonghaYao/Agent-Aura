"use client";

import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    ReactNode,
} from "react";
import { useChat } from "./ChatContext";

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

    // 从localStorage初始化数据
    const initializeExtraParams = () => {
        try {
            const savedParams = localStorage.getItem("extraParams");
            if (savedParams) {
                const parsedParams = JSON.parse(savedParams);
                // 设置默认值，如果本地存储中没有特定字段
                return {
                    main_model: parsedParams.main_model || "gpt-4.1-mini",
                    ...parsedParams,
                };
            }
        } catch (error) {
            console.error(
                "Error reading extraParams from localStorage:",
                error
            );
        }
        // 默认值
        return { main_model: "gpt-4.1-mini" };
    };

    const [extraParams, setExtraParamsState] = useState<Record<string, any>>(
        initializeExtraParams
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

    const setExtraParams = (params: Record<string, any>) => {
        setExtraParamsState(params);
    };

    return (
        <ExtraParamsContext.Provider value={{ extraParams, setExtraParams }}>
            {children}
        </ExtraParamsContext.Provider>
    );
};
