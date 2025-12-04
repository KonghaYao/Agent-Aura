import { BuiltinTool } from "../schema-agent/types";
export const createArtifactsToolDefine: BuiltinTool = {
    tool_type: "builtin",
    name: "create_artifacts",
    description: "Create and save code files to artifacts directory",
};
export const tavilySearchToolDefine: BuiltinTool = {
    tool_type: "builtin",
    name: "tavily_search",
    description: "Search the web for information",
};
export const tavilyExtractToolDefine: BuiltinTool = {
    tool_type: "builtin",
    name: "tavily_extract",
    description: "Extract the content of a web page",
};
export const sendSandboxFileToUserToolDefine: BuiltinTool = {
    tool_type: "builtin",
    name: "send_sandbox_file_to_user",
    description: "Send a file to the user",
};
export const runSandboxCodeToolDefine: BuiltinTool = {
    tool_type: "builtin",
    name: "run_sandbox_code",
    description: "Run code in a sandbox",
};

export const geminiImageProcessorToolDefine: BuiltinTool = {
    tool_type: "builtin",
    name: "gemini_image_processor",
    description: "Generate an image based on a prompt.",
};
