export const getThreadId = (context: any) => {
    return context?.configurable?.thread_id as string;
};
