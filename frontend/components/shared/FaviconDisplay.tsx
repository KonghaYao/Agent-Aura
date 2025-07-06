import React from "react";

interface FaviconDisplayProps {
    url: string;
    size?: number;
    className?: string;
}

export const FaviconDisplay: React.FC<FaviconDisplayProps> = ({
    url,
    size = 16,
    className = "",
}) => {
    let faviconUrl = "";
    try {
        faviconUrl = `https://favicone.com/${new URL(url).hostname}?s=${size}`;
    } catch (error) {
        faviconUrl = ""; // Handle invalid URLs gracefully
    }

    if (!faviconUrl) {
        return null; // Don't render anything if URL is invalid or favicon can't be generated
    }

    return (
        <img
            src={faviconUrl}
            alt="favicon"
            className={`rounded-sm ${className} inline mr-2`}
            onError={(e) => {
                // Optionally, replace with a default icon or hide on error
                e.currentTarget.style.display = "none";
            }}
        />
    );
};
