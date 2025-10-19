"use client";
import { useEffect, useState } from "react";
import { useArtifacts } from "./ArtifactsContext";
import { setArtifactStore, artifactStore } from "ai-artifacts";

export const ArtifactViewer: React.FC = () => {
    const { artifacts, currentArtifactId } = useArtifacts();
    useEffect(() => {
        console.log(artifactStore);
        setArtifactStore({
            artifacts: { default: artifacts },
        });
    }, [artifacts]);
    return (
        <ai-artifacts
            store-id="default"
            group-id={currentArtifactId?.[0] || ""}
            version-id={currentArtifactId?.[1] || ""}
        ></ai-artifacts>
    );
};
