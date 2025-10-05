import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
    const url = await req.url;

    const response = await fetch(new URL(url).searchParams.get("url")!);
    return new Response(response.body, {
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600",
        },
    });
};
