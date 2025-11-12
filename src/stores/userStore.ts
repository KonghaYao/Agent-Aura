import { atom, WritableStore } from "nanostores";
import { computed } from "nanostores";
import { authClient } from "../../lib/auth-client";

export interface User {
    id: string;
    name?: string;
    email?: string;
    image?: string;
}

interface UserState {
    user: User | null;
    loading: boolean;
    initialized: boolean;
}

class UserStore {
    private state: WritableStore<UserState>;

    constructor() {
        // 创建基础的 Store
        this.state = atom<UserState>({
            user: null,
            loading: true,
            initialized: false,
        });
    }

    // 计算属性：是否已登录
    get isAuthenticated() {
        return computed(this.state, (state) => {
            return state.initialized && !state.loading && !!state.user;
        });
    }

    // 计算属性：是否正在加载
    get isLoading() {
        return computed(this.state, (state) => state.loading);
    }

    // 计算属性：用户信息
    get user() {
        return computed(this.state, (state) => state.user);
    }

    // 获取当前状态
    getState(): UserState {
        return this.state.get();
    }

    // 设置状态
    private setState(newState: Partial<UserState>) {
        this.state.set({ ...this.state.get(), ...newState });
    }

    // 获取用户信息的函数
    async fetchUser() {
        try {
            this.setState({ loading: true });

            const session = await authClient.getSession();

            if (session?.data?.user) {
                this.setState({
                    user: session.data.user as User,
                    loading: false,
                    initialized: true,
                });
            } else {
                // 未登录状态
                this.setState({
                    user: null,
                    loading: false,
                    initialized: true,
                });

                // 如果在客户端环境且未登录，跳转到登录页
                if (typeof window !== "undefined") {
                    const currentPath = window.location.pathname;
                    // 避免在登录页和首页循环跳转
                    if (currentPath !== "/auth" && currentPath !== "/") {
                        window.location.href = "/auth";
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            this.setState({
                user: null,
                loading: false,
                initialized: true,
            });

            // 发生错误时也跳转到登录页
            if (typeof window !== "undefined") {
                const currentPath = window.location.pathname;
                if (currentPath !== "/auth" && currentPath !== "/") {
                    window.location.href = "/auth";
                }
            }
        }
    }

    // 初始化函数，在应用启动时调用
    initializeUser() {
        this.fetchUser();
    }

    // 登出函数
    async signOut() {
        try {
            await authClient.signOut();
            this.setState({
                user: null,
                loading: false,
                initialized: true,
            });

            // 登出后跳转到登录页
            if (typeof window !== "undefined") {
                window.location.href = "/auth";
            }
        } catch (error) {
            console.error("Failed to sign out:", error);
        }
    }

    // 获取用户头像初始化的工具函数
    getInitials(user: User | null): string {
        if (user?.name) {
            return user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        if (user?.email) {
            return user.email[0].toUpperCase();
        }
        return "U";
    }

    // 获取显示名称的工具函数
    getDisplayName(user: User | null): string {
        if (user?.name) return user.name;
        if (user?.email) return user.email.split("@")[0];
        return "用户";
    }
}

// 创建单例实例
export const userStore = new UserStore();
userStore.initializeUser();
