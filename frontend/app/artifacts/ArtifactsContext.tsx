import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
    useMemo,
} from "react";
import { useChat } from "../chat/context/ChatContext";
import { ToolRenderData } from "@langgraph-js/sdk";
import { useDebounceCallback } from "usehooks-ts";

export interface Artifact {
    id: string;
    code: string;
    filename: string;
    filetype: string;
    version: number;
    isTmp?: boolean;
    isLoading?: boolean;
}

interface ArtifactsContextType {
    artifacts: Artifact[];
    currentArtifact: Artifact | null;
    setCurrentArtifactById: (id: string) => void;
    getArtifactVersions: (filename: string) => Artifact[];
    showArtifact: boolean;
    setShowArtifact: (show: boolean) => void;
    createTmpArtifact: (
        code: string,
        filename: string,
        filetype: string,
    ) => void;
    tmpArtifact: Artifact | null;
    clearTmpArtifact: () => void;
}

const ArtifactsContext = createContext<ArtifactsContextType>({
    artifacts: [],
    currentArtifact: null,
    setCurrentArtifactById: () => {},
    getArtifactVersions: () => [],
    showArtifact: false,
    setShowArtifact: () => {},
    createTmpArtifact: () => {},
    tmpArtifact: null,
    clearTmpArtifact: () => {},
});

export const useArtifacts = () => useContext(ArtifactsContext);

interface ArtifactsProviderProps {
    children: ReactNode;
}

export const ArtifactsProvider: React.FC<ArtifactsProviderProps> = ({
    children,
}) => {
    const { client } = useChat();
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [showArtifact, setShowArtifact] = useState(false);
    const { renderMessages } = useChat();
    const [currentArtifactId, setCurrentArtifactId] = useState<string | null>(
        null,
    );
    const [tmpArtifact, setTmpArtifact] = useState<Artifact | null>(null);

    // 获取指定文件名的所有版本
    const getArtifactVersions = (filename: string) => {
        return artifacts
            .filter((artifact) => artifact.filename === filename)
            .sort((a, b) => a.version - b.version);
    };

    useEffect(() => {
        if (!renderMessages) return;

        const createArtifacts = renderMessages
            .filter((message) => message.type === "tool")
            .filter((message) => message.name === "create_artifacts");

        // 创建文件名到最新版本的映射
        const filenameToLatestVersion = new Map<string, number>();

        // 处理每个 artifact，分配版本号
        const processedArtifacts = createArtifacts.map((message) => {
            const tool = new ToolRenderData<
                {
                    filename: string;
                    code: string;
                    filetype: string;
                },
                {}
            >(message, client!);
            const content = tool.getInputRepaired();
            const filename = content.filename;

            let newVersion = 1;
            if (filename) {
                // 获取当前文件名的最新版本号
                const currentVersion =
                    filenameToLatestVersion.get(filename) || 0;
                newVersion = currentVersion + 1;

                // 更新最新版本号
                filenameToLatestVersion.set(filename, newVersion);
            }
            return {
                id: message.id!,
                code: content.code || "",
                filename: filename || "",
                version: newVersion,
                filetype: content.filetype || "",
                isLoading: !message.additional_kwargs?.done,
            };
        });

        setArtifacts(
            processedArtifacts.filter((artifact) => artifact !== null),
        );
    }, [renderMessages]);

    const setCurrentArtifactById = useDebounceCallback((id: string) => {
        if (currentArtifactId === id) {
            return;
        }
        setShowArtifact(true);
        setCurrentArtifactId(id);
    }, 100);
    const currentArtifact = useMemo(() => {
        if (tmpArtifact?.id === currentArtifactId) {
            return tmpArtifact;
        }
        return (
            artifacts.find((artifact) => artifact.id === currentArtifactId) ||
            null
        );
    }, [artifacts, currentArtifactId, tmpArtifact]);

    // 创建临时 artifact 并立即展示
    const createTmpArtifact = (
        code: string,
        filename: string,
        filetype: string,
    ) => {
        const newTmpArtifact: Artifact = {
            id: `tmp-${Date.now()}`,
            code,
            filename,
            filetype,
            version: 0,
            isTmp: true,
        };

        setTmpArtifact(newTmpArtifact);
        setCurrentArtifactId(newTmpArtifact.id);
        setShowArtifact(true);
    };

    // 清除临时 artifact
    const clearTmpArtifact = () => {
        setTmpArtifact(null);
        if (currentArtifact?.isTmp) {
            setCurrentArtifactId(null);
        }
    };

    return (
        <ArtifactsContext.Provider
            value={{
                artifacts,
                currentArtifact,
                setCurrentArtifactById,
                getArtifactVersions,
                showArtifact,
                setShowArtifact,
                createTmpArtifact,
                tmpArtifact,
                clearTmpArtifact,
            }}
        >
            {children}
        </ArtifactsContext.Provider>
    );
};
