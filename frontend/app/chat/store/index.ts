export const getLocalConfig = () => {
    return {
        showHistory: localStorage.getItem("showHistory") === "true" || false,
        showGraph: localStorage.getItem("showGraph") === "true" || false,
    };
};
export const setLocalConfig = (
    config: Partial<{ showHistory: boolean; showGraph: boolean }>
) => {
    Object.entries(config).forEach(([key, value]) => {
        localStorage.setItem(key, value.toString());
    });
};
