import executor from "../prompts/executor.md?raw";
import artifacts_usage from "../prompts/artifacts-usage.md?raw";
import style from "../prompts/style.md?raw";
const promptFiles = {
    executor,
    "artifacts-usage": artifacts_usage,
    style,
};
export const getPrompt = async (
    name: keyof typeof promptFiles,
    addPrefix = true
): Promise<string> => {
    return promptFiles[name];
};
