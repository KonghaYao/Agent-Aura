import { tool } from "@langchain/core/tools";
import { store } from "./index.js";
import { z } from "zod";
import { ConfigurationState } from "../agent/state";

export const add_memories = tool(
    async ({ text, source }, config): Promise<string> => {
        const userId = (config as typeof ConfigurationState.State).metadata
            .userId;
        await store.initialize();

        // 使用当前时间戳作为 key 来确保唯一性
        const key = crypto.randomUUID();

        await store.put(userId, key, text + "\nFrom:" + source);

        return `memory added: ${key}`;
    },
    {
        description:
            "Add a new memory. This method is called everytime the user informs anything about themselves, their preferences, or anything that has any relevant information which can be useful in the future conversation. This can also be called when the user asks you to remember something. ",
        name: "add_memories",
        schema: z.object({
            text: z
                .string()
                .max(400)
                .describe(
                    "The memory to add. Markdown format. use \\n to separate paragraphs. You can only add 400 words",
                ),
            source: z
                .string()
                .describe("The source of the memory. a URL or a file name"),
        }),
    },
);

export const search_memory = tool(
    async ({ query }, config): Promise<string> => {
        const userId = (config as typeof ConfigurationState.State).metadata
            .userId;
        console.log(userId);
        await store.initialize();
        const results = await store.search(userId, query, 5);
        return results.map((result) => result.text).join("\n");
    },
    {
        description: "Search through stored memories. ",
        name: "search_memory",
        schema: z.object({
            query: z.string(),
        }),
    },
);
