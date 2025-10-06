import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { createLLM } from "../../agent/state";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

const createLLMRouter = (
    createModel: (model: string) => Promise<BaseChatModel>,
) => {
    const app = new Hono();
    /**
     * @api {post} /llm/response LLM流式对话接口
     * @apiName LLMResponse
     * @apiGroup LLM
     *
     * @apiParam {String} model 模型名称，例如 "gpt-4o-mini"
     * @apiParam {String} prompt 用户输入的提示词
     * @apiParam {String} [system] 系统消息，默认为 "You are a helpful assistant that can answer questions and help with tasks."
     *
     * @apiSuccess (200) {Stream} response LLM的流式回复内容
     * @apiError (400) {Object} error 缺少必要的参数（model或prompt）
     * @apiError (500) {Object} error 内部服务器错误
     */
    app.post("/response", async (c) => {
        try {
            const {
                model,
                prompt,
                system = "You are a helpful assistant that can answer questions and help with tasks.",
            } = await c.req.json();

            if (!model || !prompt) {
                return c.json(
                    {
                        error:
                            "model and prompt are required! " +
                            model +
                            " " +
                            prompt,
                    },
                    400,
                );
            }

            const llm = await createModel(model);
            return streamText(c, async (stream) => {
                const response = await llm.stream([
                    new SystemMessage(system),
                    new HumanMessage(prompt),
                ]);

                for await (const chunk of response) {
                    const content =
                        typeof chunk.content === "string"
                            ? chunk.content
                            : JSON.stringify(chunk.content);
                    await stream.write(content);
                }
            });
        } catch (error) {
            console.error("Error in simple-llm:", error);
            return c.json({ error: "Internal server error" }, 500);
        }
    });

    /**
     * @api {post} /llm/structured-response LLM结构化输出接口
     * @apiName LLMStructuredResponse
     * @apiGroup LLM
     *
     * @apiParam {String} model 模型名称，例如 "gpt-4o-mini"
     * @apiParam {String} prompt 用户输入的提示词
     * @apiParam {Object} schema 定义输出结构的JSON Schema对象
     * @apiParam {String} [system] 系统消息，默认为 "You are a helpful assistant that can answer questions and help with tasks."
     *
     * @apiSuccess (200) {Object} response LLM返回的结构化JSON对象
     * @apiError (400) {Object} error 缺少必要的参数（model、prompt或schema）
     * @apiError (500) {Object} error 内部服务器错误
     */
    app.post("/structured-response", async (c) => {
        try {
            const {
                model,
                prompt,
                schema,
                system = "You are a helpful assistant that can answer questions and help with tasks.",
            } = await c.req.json();

            if (!model || !prompt || !schema) {
                return c.json(
                    { error: "model, prompt, and schema are required" },
                    400,
                );
            }

            const llm = await createModel(model);

            const llmWithStructuredOutput = llm.withStructuredOutput(schema);

            const response = await llmWithStructuredOutput.invoke([
                new SystemMessage(system),
                new HumanMessage(prompt),
            ]);

            return c.json(response);
        } catch (error) {
            console.error("Error in structured-output-llm:", error);
            return c.json({ error: "Internal server error" }, 500);
        }
    });

    /**
     * @api {post} /llm/response-with-messages LLM流式对话（支持消息数组）接口
     * @apiName LLMResponseWithMessages
     * @apiGroup LLM
     *
     * @apiParam {String} model 模型名称，例如 "gpt-4o-mini"
     * @apiParam {Array} messages 消息数组，每个元素包含 { type: 'human' | 'system', content: string }
     *
     * @apiSuccess (200) {Stream} response LLM的流式回复内容
     * @apiError (400) {Object} error 缺少必要的参数（model或messages）或messages格式不正确
     * @apiError (500) {Object} error 内部服务器错误
     */
    app.post("/response-with-messages", async (c) => {
        try {
            const { model, messages } = await c.req.json();

            if (!model || !Array.isArray(messages) || messages.length === 0) {
                return c.json(
                    {
                        error: "model and a non-empty messages array are required",
                    },
                    400,
                );
            }

            const llm = await createModel(model);
            const langChainMessages = messages.map((msg: any) => {
                if (msg.type === "human") {
                    // 检查 content 是否为数组
                    if (Array.isArray(msg.content)) {
                        // 如果是数组，直接传递
                        return new HumanMessage({
                            content: msg.content,
                        });
                    } else {
                        // 否则按字符串处理
                        return new HumanMessage(msg.content);
                    }
                } else if (msg.type === "system") {
                    return new SystemMessage(
                        msg.content ||
                            "You are a helpful assistant that can answer questions and help with tasks.",
                    );
                } else {
                    throw new Error(`Unsupported message type: ${msg.type}`);
                }
            });
            return streamText(c, async (stream) => {
                const response = await llm.stream(langChainMessages);

                for await (const chunk of response) {
                    const content =
                        typeof chunk.content === "string"
                            ? chunk.content
                            : JSON.stringify(chunk.content);
                    await stream.write(content);
                }
            });
        } catch (error) {
            console.error("Error in llm/response-with-messages:", error);
            return c.json({ error: "Internal server error" }, 500);
        }
    });

    return app;
};

export default createLLMRouter((model) =>
    createLLM(
        {
            main_model: model,
            reasoning_model: model,
        },
        "main_model",
    ),
);
