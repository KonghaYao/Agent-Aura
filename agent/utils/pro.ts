export const getThreadId = (context: any) => {
    return context?.configurable?.thread_id as string;
};

export const getToolCallId = (context: any) => {
    return context?.toolCall?.id as string;
};
