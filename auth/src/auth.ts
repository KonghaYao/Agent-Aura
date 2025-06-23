import NodeClient, {
    PersistKey,
    type GetContextParameters,
    type LogtoConfig,
    type SignInOptions,
} from "@logto/node";
import { Hono } from "hono";
import type { Context, Next } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

export type LogtoHonoConfig = LogtoConfig & {
    authRoutesPrefix?: string;
    signInOptions?: Omit<SignInOptions, "redirectUri" | "postRedirectUri">;
    cookieSecret: string;
    cookieSecure: boolean;
    callbackUrl: {
        signIn: string;
        signOut: string;
    };
} & GetContextParameters;

// 定义包含用户信息的变量类型
type Variables = {
    user: any;
};

export const handleAuthRoutes = (config: LogtoHonoConfig) => {
    const app = new Hono<{ Variables: Variables }>();
    // 登录路由
    app.get(`/sign-in`, async (c) => {
        let res: any;
        const nodeClient = new NodeClient(config, {
            storage: createStorage(c, config),
            navigate: (url) => {
                res = c.redirect(url);
                return Promise.resolve();
            },
        });

        await nodeClient.signIn({
            ...config.signInOptions,
            redirectUri: new URL(`./sign-in-callback`, c.req.url).toString(),
        });
        return res;
    });

    // 注册路由
    app.get(`/sign-up`, async (c) => {
        let res: any;
        const nodeClient = new NodeClient(config, {
            storage: createStorage(c, config),
            navigate: (url) => {
                res = c.redirect(url);
                return Promise.resolve();
            },
        });

        await nodeClient.signIn({
            ...config.signInOptions,
            redirectUri: new URL(`./sign-in-callback`, c.req.url).toString(),
            firstScreen: "register",
        });
        return res;
    });

    // 登录回调路由
    app.get(`/sign-in-callback`, async (c) => {
        const nodeClient = new NodeClient(config, {
            storage: createStorage(c, config),
            navigate: (url) => {
                c.redirect(url);
                return Promise.resolve();
            },
        });
        await nodeClient.handleSignInCallback(c.req.url);
        return c.redirect(config.callbackUrl.signIn);
    });

    // 登出路由
    app.get(`/sign-out`, async (c) => {
        let res: any;
        const nodeClient = new NodeClient(config, {
            storage: createStorage(c, config),
            navigate: (url) => {
                res = c.redirect(url);
                return Promise.resolve();
            },
        });

        await nodeClient.signOut(config.callbackUrl.signOut);
        return res;
    });
    app.get("/is-sign-in", withLogto(config), (c) => {
        return c.json({
            isSignIn: c.get("user"),
        });
    });
    app.get("/index", (c) => {
        return c.html(`Auth Index`);
    });

    return app;
};
// 创建一个基于 Hono Context 的存储
const createStorage = (c: Context, config: LogtoHonoConfig) => {
    return {
        async getItem(key: PersistKey): Promise<string | null> {
            return getCookie(c, key + "_" + config.cookieSecret) ?? null;
        },
        async setItem(key: PersistKey, value: string): Promise<void> {
            setCookie(c, key + "_" + config.cookieSecret, value);
        },
        async removeItem(key: PersistKey): Promise<void> {
            deleteCookie(c, key + "_" + config.cookieSecret);
        },
    };
};

export const getUserFromRequest =
    (config: LogtoHonoConfig) => async (c: Request) => {
        const cookie = c.headers.get("cookie");
        if (!cookie) {
            return null;
        }
        const cookieStore = cookie.split(";").reduce((acc, curr) => {
            const [key, value] = curr.split("=");
            if (key && value) {
                acc[key.trim()] = decodeURIComponent(value.trim());
            }
            return acc;
        }, {} as Record<string, string>);
        const client = new NodeClient(config, {
            storage: {
                async getItem(key: PersistKey): Promise<string | null> {
                    return (
                        cookieStore?.[key + "_" + config.cookieSecret] ?? null
                    );
                },
                async setItem(key: PersistKey, value: string): Promise<void> {
                    cookieStore[key + "_" + config.cookieSecret] = value;
                },
                async removeItem(key: PersistKey): Promise<void> {
                    delete cookieStore[key + "_" + config.cookieSecret];
                },
            },
            navigate: (url) => {},
        });
        const user = await client.getContext({
            getAccessToken: config.getAccessToken,
            resource: config.resource,
            fetchUserInfo: config.fetchUserInfo,
            getOrganizationToken: config.getOrganizationToken,
        });
        return user;
    };

export const getUserFromContext =
    (config: LogtoHonoConfig) => async (c: Context) => {
        const client = new NodeClient(config, {
            storage: createStorage(c, config),
            navigate: (url) => {},
        });
        const user = await client.getContext({
            getAccessToken: config.getAccessToken,
            resource: config.resource,
            fetchUserInfo: config.fetchUserInfo,
            getOrganizationToken: config.getOrganizationToken,
        });
        return user;
    };
export const withLogto =
    (config: LogtoHonoConfig) =>
    async (c: Context<{ Variables: Variables }>, next: Next) => {
        try {
            const user = await getUserFromContext(config)(c);
            c.set("user", user);
            return next();
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                404,
            );
        }
    };
