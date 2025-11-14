"use client";
import { useEffect, useState } from "react";
import { useArtifacts } from "./ArtifactsContext";

if (typeof window !== "undefined") {
    await import("ai-artifacts");
}
export const ArtifactViewer: React.FC = () => {
    const { artifacts, currentArtifactId, artifactDataVersion } =
        useArtifacts();
    useEffect(() => {
        (async () => {
            const { setArtifactStore } = await import("ai-artifacts");
            setArtifactStore({
                artifacts: { default: artifacts },
            });
        })();
    }, [artifactDataVersion]); // 使用 dataVersion 而不是 artifacts 来检测变更
    return (
        <ai-artifacts
            store-id="default"
            group-id={currentArtifactId?.[0] || ""}
            version-id={currentArtifactId?.[1] || ""}
        ></ai-artifacts>
    );
};
