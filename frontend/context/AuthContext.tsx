"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";

export interface UserInfo {
    name?: string;
    email?: string;
    picture?: string;
    sub?: string;
    isAuthenticated?: boolean;
}

interface AuthContextType {
    isSignIn: boolean;
    userInfo: UserInfo | null;
    isLoading: boolean;
    checkIsSignIn: () => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isSignIn, setIsSignIn] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkIsSignIn = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(
                process.env.NEXT_PUBLIC_LANGGRAPH_API_URL + "/auth/is-sign-in",
                {
                    credentials: "include",
                },
            );
            const data = await res.json();
            setIsSignIn(data.isSignIn?.isAuthenticated || false);
            setUserInfo(data.isSignIn || null);
        } catch (error) {
            console.error("检查登录状态失败:", error);
            setIsSignIn(false);
            setUserInfo(null);
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = () => {
        window.location.href =
            process.env.NEXT_PUBLIC_LANGGRAPH_API_URL + "/auth/sign-out";
    };

    useEffect(() => {
        checkIsSignIn();
    }, []);

    const value = {
        isSignIn,
        userInfo,
        isLoading,
        checkIsSignIn,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export default AuthProvider;
