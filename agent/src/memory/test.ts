import { store } from "./index";

/**
 * MilvusStore 测试用例
 */
async function testMilvusStore() {
    console.log("开始测试 MilvusStore...");

    try {
        // 初始化存储
        console.log("1. 初始化存储...");
        await store.initialize();

        const userId = "test-user-1750431057476";
        console.log(`使用测试用户ID: ${userId}`);

        // 测试数据
        const testItems = [
            {
                key: "react-intro",
                value: "React是一个前端框架，用于构建用户界面。",
            },
            {
                key: "js-basics",
                value: "JavaScript是一种编程语言，常用于Web开发。",
            },
            {
                key: "python-data",
                value: "Python是数据分析的强大工具，配合pandas等库使用。",
            },
        ];

        // 添加测试数据;
        console.log("2. 添加测试数据...");
        // for (const item of testItems) {
        //     await store.put(userId, item.key, item.value);
        //     console.log(`  - 已添加: ${item.key}`);
        // }

        // 测试获取单个数据
        console.log("3. 测试获取单个数据...");
        const result = await store.get(userId, "react-intro");
        console.log("  获取结果:", result);

        await store.put(userId, "python-data", "React233");

        // 测试搜索功能
        console.log("4. 测试搜索功能...");
        console.log("  4.1 搜索 'JavaScript':");
        const jsResults = await store.search(userId, "JavaScript");
        console.log(`  找到 ${jsResults.length} 条结果:`);
        jsResults.forEach((item, i) => {
            console.log(item);
        });

        console.log("  4.2 搜索 '数据':");
        const dataResults = await store.search(userId, "数据");
        console.log(`  找到 ${dataResults.length} 条结果:`);
        dataResults.forEach((item, i) => {
            console.log(item);
        });

        console.log("5. 测试限制结果数量...");
        const limitedResults = await store.search(userId, "数据", 1);
        console.log(`  限制为1条结果，实际获得 ${limitedResults.length} 条`);

        console.log("测试完成!");
    } catch (error) {
        console.error("测试过程中出现错误:", error);
    }
}

// 运行测试
testMilvusStore().catch(console.error);
