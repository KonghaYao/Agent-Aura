import {
    createChatStore,
    createUITool,
    ToolManager,
    TestLangGraphChat,
} from "@langgraph-js/sdk";
import { test, expect } from "vitest";
import z from "zod";
// 创建 store 工厂函数
const createLangGraphClient = () =>
    createChatStore(
        "agent",
        {
            apiUrl: "http://localhost:8123",
            defaultHeaders: {},
            callerOptions: {
                // 携带 cookie 的写法
                fetch: (url: string, options: RequestInit) => {
                    options.headers = {
                        ...(options.headers || {}),
                        Authorization: `Bearer test`,
                    };
                    options.credentials = "include";
                    return fetch(url, options);
                },
            },
        },
        {
            async onInit(client) {},
        },
    );

// test(
//     "工具链测试",
//     {
//         timeout: 10 * 1000,
//     },
//     async () => {
//         const testChat = new TestLangGraphChat(createLangGraphClient(), false);
//         await testChat.humanInput(
//             "请你思考一次关于如何提高工作效率的方案, 思考次数为 1 次, 回复字数在 30 字以内",
//             async () => {
//                 const message = await testChat.waitFor(
//                     "tool",
//                     "sequential-thinking",
//                 );
//                 expect(JSON.parse(message.tool_input!).thought).toBeDefined();

//                 const aiMessage = await testChat.waitFor("ai");
//                 expect(aiMessage.content).includes("效率");
//                 // expect(message.content).includes("工作效率");
//             },
//         );
//     },
// );

test(
    "前端工具测试",
    {
        timeout: 20 * 1000,
    },
    async () => {
        const ask_user_for_approve = createUITool({
            name: "ask_user_for_approve",
            description:
                "Request user review and approval for plans or content, wait for user feedback before proceeding",
            parameters: {
                title: z
                    .string()
                    .describe("Title or subject of the content to be reviewed"),
            },
            handler: ToolManager.waitForUIDone,
        });
        const testChat = new TestLangGraphChat(createLangGraphClient(), {
            debug: true,
            tools: [ask_user_for_approve],
        });

        await testChat.humanInput("请你请求我的许可", async () => {
            const message = await testChat.waitFor(
                "tool",
                "ask_user_for_approve",
            );
            // console.log("message", testChat.store.data.client.get()?.tools);
            await testChat.responseFeTool(message, "ok");
            const aiMessage = await testChat.waitFor("ai");
            expect(aiMessage.content).toBeDefined();
        });
    },
);
