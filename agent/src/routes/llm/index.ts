import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { createLLM } from "../../agent/state";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
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

        const llm = await createLLM(
            {
                main_model: model,
            },
            "main_model",
        );
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

        const llm = await createLLM(
            {
                main_model: model,
            },
            "main_model",
        );

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

export default app;
