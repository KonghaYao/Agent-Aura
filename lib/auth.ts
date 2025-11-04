import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { Resend } from "resend";
import { getEnv } from "../agent/getEnv";

async function sendEmail({
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
    advanced: {
        crossSubDomainCookies: getEnv("AUTH_COOKIE_DOMAIN") && {
            enabled: true,
            domain: getEnv("AUTH_COOKIE_DOMAIN"),
        },
    },
    database: new Pool({
        connectionString: getEnv("AUTH_DATABASE_URL"),
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
