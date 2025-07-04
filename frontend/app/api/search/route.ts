import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
    const data = await req.json();

    const response = await fetch(
        "https://website-to-md.deno.dev/website-to-md/search",
        { method: "POST", body: JSON.stringify(data) },
    );
    return new Response(response.body, {
        headers: {
            "Content-Type": "text/markdown",
        },
    });
};
