export interface MCPServerConfig {
    url?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
}
