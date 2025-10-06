import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
    const url = (await req.json()).url;
    if (!url) {
        return new Response("URL is required", { status: 400 });
    }
    const response = await fetch(
        "https://website-to-md.deno.dev/website-to-md/extract",
        { method: "POST", body: JSON.stringify({ url }) },
    );
    return new Response(response.body, {
        headers: {
            "Content-Type": "text/markdown",
        },
    });
};
