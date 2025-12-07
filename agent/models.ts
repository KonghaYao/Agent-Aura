export const defaultModelsAllowed = [
    {
        provider: "openai",
        model: "grok-4-fast",
    },
    {
        provider: "openai",
        model: "grok-code-fast",
    },
    {
        provider: "openai",
        model: "gemini-2.5-flash",
    },
    {
        provider: "openai",
        model: "gemini-2.0-flash",
    },
    {
        provider: "openai",
        model: "gpt-5-nano",
    },
    {
        provider: "openai",
        model: "gpt-4o-mini",
    },
    {
        provider: "openai",
        model: "deepseek-chat",
    },
];
export const models = {
    main_model: defaultModelsAllowed.map((m) => m.model),
    reasoning_model: ["o4-mini"],
};
