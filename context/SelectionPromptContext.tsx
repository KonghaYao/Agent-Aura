"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SelectionPromptState {
    isOpen: boolean;
    selectedText: string;
    position: { x: number; y: number } | null;
    prompt: string;
    isLoading: boolean;
    response: string;
}

interface SelectionPromptContextType {
    state: SelectionPromptState;
    showDialog: (
        selectedText: string,
        position: { x: number; y: number },
    ) => void;
    hideDialog: () => void;
    setPrompt: (prompt: string) => void;
    setLoading: (loading: boolean) => void;
    setResponse: (response: string) => void;
    clearResponse: () => void;
}

const SelectionPromptContext = createContext<
    SelectionPromptContextType | undefined
>(undefined);

const initialState: SelectionPromptState = {
    isOpen: false,
    selectedText: "",
    position: null,
    prompt: "",
    isLoading: false,
    response: "",
};

export function SelectionPromptProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<SelectionPromptState>(initialState);

    const showDialog = (
        selectedText: string,
        position: { x: number; y: number },
    ) => {
        setState((prev) => ({
            ...prev,
            isOpen: true,
            selectedText,
            position,
            response: "", // 清空之前的回复
        }));
    };

    const hideDialog = () => {
        setState((prev) => ({
            ...prev,
            isOpen: false,
            prompt: "",
            response: "",
            isLoading: false,
        }));
    };

    const setPrompt = (prompt: string) => {
        setState((prev) => ({ ...prev, prompt }));
    };

    const setLoading = (loading: boolean) => {
        setState((prev) => ({ ...prev, isLoading: loading }));
    };

    const setResponse = (response: string) => {
        setState((prev) => ({ ...prev, response }));
    };

    const clearResponse = () => {
        setState((prev) => ({ ...prev, response: "" }));
    };

    const value: SelectionPromptContextType = {
        state,
        showDialog,
        hideDialog,
        setPrompt,
        setLoading,
        setResponse,
        clearResponse,
    };

    return (
        <SelectionPromptContext.Provider value={value}>
            {children}
        </SelectionPromptContext.Provider>
    );
}

export function useSelectionPrompt() {
    const context = useContext(SelectionPromptContext);
    if (context === undefined) {
        throw new Error(
            "useSelectionPrompt must be used within a SelectionPromptProvider",
        );
    }
    return context;
}
