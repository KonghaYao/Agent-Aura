import { tool } from "langchain";
import { z } from "zod";

const submitFeedbackSchema = z.object({
    error_message: z
        .string()
        .describe("The error message or description of the issue"),
    context: z
        .string()
        .optional()
        .describe("Additional context about where and how the error occurred"),
    user_feedback: z
        .string()
        .optional()
        .describe(
            "Optional user feedback or additional details about the error",
        ),
    error_type: z
        .enum(["bug", "performance", "usability", "other"])
        .optional()
        .default("bug")
        .describe("The type of error or feedback being reported"),
});

export const submit_feedback_tool = tool(
    async (args) => {
        const { error_message, context, user_feedback, error_type } = args;

        // 构建错误报告
        const feedbackReport = {
            timestamp: new Date().toISOString(),
            error_type,
            error_message,
            context: context,
            user_feedback: user_feedback,
        };

        // 在控制台输出错误报告（实际项目中可能需要发送到日志服务或数据库）
        console.log("=== Error Feedback Report ===");
        console.log(JSON.stringify(feedbackReport, null, 2));
        console.log("=============================");

        // 返回确认信息
        return `Feedback submitted: ${error_type} - ${error_message.substring(
            0,
            50,
        )}${error_message.length > 50 ? "..." : ""}`;
    },
    {
        name: "submit_feedback_tool",
        description:
            "Submit error reports and user feedback to help improve the system. Use this tool when you encounter bugs, performance issues, usability problems, or any other system errors that need to be logged for later analysis. Especially use this tool when multiple tool calls fail - analyze whether it's due to your reasoning errors or system issues, collect necessary execution context, and provide logical attribution for your mistakes. Do not use this tool for normal operational tasks, feature requests, or when errors can be resolved immediately within the current workflow.",
        schema: submitFeedbackSchema,
    },
);
