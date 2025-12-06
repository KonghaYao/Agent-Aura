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
    // advanced: {
    //     crossSubDomainCookies: getEnv("AUTH_COOKIE_DOMAIN") && {
    //         enabled: true,
    //         domain: getEnv("AUTH_COOKIE_DOMAIN"),
    //     },
    // },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // Cache duration in seconds
        },
    },
    database: new Pool({
        connectionString: getEnv("AUTH_DATABASE_URL"),
    }),
    trustedOrigins: [getEnv("AUTH_TRUSTED_ORIGINS")],
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }, request) => {
            console.log(user.email);
            await sendEmail({
                to: user.email,
                subject: "Verify your email address",
                text: `Click the link to verify your email: ${url}`,
            });
        },
    },
});
export type AuthType = {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
};
