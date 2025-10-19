import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
    useMemo,
} from "react";
import { useChat } from "@langgraph-js/sdk/react";
import { ToolRenderData } from "@langgraph-js/sdk";
import { useDebounceCallback } from "usehooks-ts";
import { ArtifactCommand } from "@/agent/tools/create_artifacts";

export interface ComposedArtifact {
    id: string;
    filename: string;
    filetype: string;
    versions: Artifact[];
}

export interface Artifact {
    group_id: string;
    id: string;
    code: string;
    filename: string;
    filetype: string;
    version: number;
    is_done: boolean;
}

interface ArtifactsContextType {
    artifacts: ComposedArtifact[];

    currentArtifactId: [string, string] | null;
    setCurrentArtifactById: (id: string, tool_id: string) => void;
    showArtifact: boolean;
    setShowArtifact: (show: boolean) => void;
}

const ArtifactsContext = createContext<ArtifactsContextType>({
    artifacts: [],
    currentArtifactId: null,
    setCurrentArtifactById: () => {},
    showArtifact: false,
    setShowArtifact: () => {},
});

export const useArtifacts = () => useContext(ArtifactsContext);

interface ArtifactsProviderProps {
    children: ReactNode;
}

export const useArtifactsStore = (): ComposedArtifact[] => {
    const { renderMessages, client } = useChat();

    return useMemo(() => {
        type MiddleArtifactCommand = ArtifactCommand & {
            tool_id?: string;
            is_done?: boolean;
        };
        const files = new Map<string, MiddleArtifactCommand[]>();
        for (const message of renderMessages) {
            if (
                message.type === "tool" &&
                message.name === "create_artifacts"
            ) {
                const tool = new ToolRenderData<ArtifactCommand, {}>(
                    message,
                    client!,
                );
                const command =
                    tool.getInputRepaired() as MiddleArtifactCommand;
                if (!command.id) continue;
                command.tool_id = tool.message.id!;
                command.is_done = tool.state === "done";
                files.set(command.id, [
                    ...(files.get(command.id) || []),
                    command,
                ]);
            }
        }
        const composedFiles = new Map<string, Artifact[]>();

        // 遍历每个 ID 的命令序列，生成对应的 artifact 版本
        for (const [id, commands] of files) {
            const artifacts: Artifact[] = [];
            let currentContent = "";
            let currentFilename = "";
            let currentFiletype = "";
            let version = 1;

            // 按命令顺序处理每个操作
            for (const command of commands) {
                switch (command.command) {
                    case "create":
                        // 创建新 artifact，直接使用 content
                        currentContent = command.content;
                        currentFilename = command.title || `artifact-${id}`;
                        currentFiletype = command.type || command.language;
                        break;

                    case "update":
                        // 更新现有内容，使用 old_str 和 new_str 进行替换
                        if (command.old_str && command.new_str) {
                            currentContent = currentContent.replace(
                                command.old_str,
                                command.new_str,
                            );
                        } else if (command.content) {
                            // 如果没有 old_str/new_str，则直接使用 content 覆盖
                            currentContent = command.content;
                        }
                        break;

                    case "rewrite":
                        currentContent = command.content;
                        break;
                }

                // 创建当前版本的 artifact
                const artifact: Artifact = {
                    group_id: id,
                    id: command.tool_id!,
                    code: currentContent,
                    filename: currentFilename,
                    filetype: currentFiletype,
                    version: version,
                    is_done: command.is_done!,
                };

                artifacts.push(artifact);
                version++;
            }

            composedFiles.set(id, artifacts);
        }

        return [...composedFiles.values()].map((artifacts) => ({
            id: artifacts[0].group_id,
            filename: artifacts[artifacts.length - 1].filename,
            filetype: artifacts[artifacts.length - 1].filetype,
            versions: artifacts,
        }));
    }, [renderMessages, client]);
};

export const ArtifactsProvider: React.FC<ArtifactsProviderProps> = ({
    children,
}) => {
    const [showArtifact, setShowArtifact] = useState(false);
    const artifacts = useArtifactsStore();

    const [currentArtifactId, setCurrentArtifactId] = useState<
        [string, string] | null
    >(null);
    const setCurrentArtifactById = useDebounceCallback(
        (id: string, tool_id: string) => {
            if (
                currentArtifactId?.[0] === id &&
                currentArtifactId?.[1] === tool_id
            ) {
                return;
            }
            setShowArtifact(true);
            setCurrentArtifactId([id, tool_id]);
        },
        100,
    );

    return (
        <ArtifactsContext.Provider
            value={{
                artifacts: artifacts,
                currentArtifactId,
                setCurrentArtifactById,
                showArtifact,
                setShowArtifact,
            }}
        >
            {children}
        </ArtifactsContext.Provider>
    );
};
