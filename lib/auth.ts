import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { Resend } from "resend";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

async function sendEmail({
    to,
    subject,
    text,
}: {
    to: string;
    subject: string;
    text: string;
}) {
    try {
        await resend.emails.send({
            from: "Agent Aura <onboarding@resend.dev>",
            to: [to],
            subject,
            html: `<p>${text}</p>`,
        });
    } catch (error) {
        console.error("Failed to send email:", error);
        throw error;
    }
}

export const auth = betterAuth({
    database: new Pool({
        connectionString: import.meta.env.AUTH_DATABASE_URL,
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }, request) => {
            await sendEmail({
                to: user.email,
                subject: "Verify your email address",
                text: `Click the link to verify your email: ${url}`,
            });
        },
    },
});
