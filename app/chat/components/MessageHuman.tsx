"use client";

import React from "react";

interface MessageHumanProps {
    content: string | any[];
}

const MessageHuman: React.FC<MessageHumanProps> = ({ content }) => {
    const renderContent = () => {
        if (typeof content === "string") {
            return <div className=" whitespace-pre-wrap">{content}</div>;
        }

        if (Array.isArray(content)) {
            return content.map((item, index) => {
                switch (item.type) {
                    case "text":
                        return (
                            <div key={index} className="">
                                {item.text}
                            </div>
                        );
                    case "image_url":
                        return (
                            <div key={index} className="mt-2">
                                <img
                                    src={item.image_url.url}
                                    alt="用户上传的图片"
                                    className="max-w-[200px] rounded"
                                />
                            </div>
                        );
                    case "audio":
                        return (
                            <div key={index} className="mt-2">
                                <audio
                                    controls
                                    src={item.audio_url}
                                    className="w-full">
                                    您的浏览器不支持音频播放
                                </audio>
                            </div>
                        );
                    default:
                        return (
                            <div
                                key={index}
                                className="text-white whitespace-pre-wrap">
                                {JSON.stringify(item)}
                            </div>
                        );
                }
            });
        }

        return (
            <div className=" whitespace-pre-wrap">
                {JSON.stringify(content)}
            </div>
        );
    };

    return (
        <div className="flex flex-row w-full justify-end ">
            <div className="flex flex-col w-fit bg-neutral-200 rounded-lg max-w-[80%]">
                <div className="flex flex-col px-4 py-2">{renderContent()}</div>
            </div>
        </div>
    );
};

export default MessageHuman;
