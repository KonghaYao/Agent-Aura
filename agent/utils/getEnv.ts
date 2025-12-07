export const getEnv = (name: string) => {
    return globalThis.process.env?.[name] || import.meta?.env?.[name];
};
