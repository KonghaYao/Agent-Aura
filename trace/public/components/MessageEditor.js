import { For, Show } from "solid-js";
import html from "solid-js/html";
import { createLucideIcon } from "../icons.js";

const messageTypes = ["system", "human", "ai", "user"];

export const MessageEditor = (props) => {
    return html`
        <div class="space-y-3">
            ${() =>
                props.messages().map(
                    (message, index) => html`
                        <div
                            class="bg-white border border-gray-200 rounded-lg p-3"
                        >
                            <div class="flex justify-between items-center mb-2">
                                <select
                                    value=${message[0]}
                                    onchange=${(e) =>
                                        props.onUpdateMessage(
                                            index,
                                            e.target.value,
                                            message[1],
                                        )}
                                    class="font-semibold text-xs uppercase bg-transparent focus:outline-none"
                                >
                                    ${For({
                                        each: messageTypes,
                                        children: (type) =>
                                            html`<option
                                                value=${type}
                                                selected=${message[0] === type}
                                            >
                                                ${type}
                                            </option>`,
                                    })}
                                </select>
                                <div class="flex items-center">
                                    <button
                                        onclick=${() =>
                                            props.onRemoveMessage(index)}
                                        class="p-1 text-gray-400 hover:text-red-500"
                                    >
                                        ${createLucideIcon("trash-2")}
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value=${message[1]}
                                onchange=${(e) =>
                                    props.onUpdateMessage(
                                        index,
                                        message[0],
                                        e.target.value,
                                    )}
                                placeholder="Enter a message..."
                                class="w-full p-2 border border-gray-300 rounded-md resize-y focus:ring-2 focus:ring-blue-400"
                                rows="3"
                            ></textarea>
                        </div>
                    `,
                )}
        </div>
    `;
};
