import { getEnv } from "@/agent/utils/getEnv";
import { Resend } from "resend";

export async function sendEmail({
    to,
    subject,
    text,
}: {
    to: string;
    subject: string;
    text: string;
}) {
    const resend = new Resend(getEnv("RESEND_API_KEY"));
    try {
        return await resend.emails.send({
            from: "Agent Aura <onboarding@email.agent-aura.top>",
            to: [to],
            subject,
            html: `<p>${text}</p>`,
        });
    } catch (error) {
        console.error("Failed to send email:", error);
        throw error;
    }
}
