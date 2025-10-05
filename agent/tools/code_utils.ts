import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";

const GREP_MAX_FILES = 20;

export const grepTool = tool(
    async ({
        contentPattern,
        directory,
        fileGlob,
        caseInsensitive = false,
        invertMatch = false,
        extendedRegexp = false,
        wordRegexp = false,
        showLineNumbers = false,
        afterContext,
        beforeContext,
        context,
    }: {
        contentPattern: string;
        directory: string;
        fileGlob?: string;
        caseInsensitive?: boolean;
        invertMatch?: boolean;
        extendedRegexp?: boolean;
        wordRegexp?: boolean;
        showLineNumbers?: boolean;
        afterContext?: number;
        beforeContext?: number;
        context?: number;
    }) => {
        try {
            let command = `grep -r `;

            if (fileGlob) {
                command += ` --include='${fileGlob}'`;
            }
            if (caseInsensitive) {
                command += " -i";
            }
            if (invertMatch) {
                command += " -v";
            }
            if (extendedRegexp) {
                command += " -E";
            }
            if (wordRegexp) {
                command += " -w";
            }
            if (showLineNumbers) {
                command += " -n";
            }
            if (context !== undefined) {
                command += ` -C ${context}`;
            } else {
                if (afterContext !== undefined) {
                    command += ` -A ${afterContext}`;
                }
                if (beforeContext !== undefined) {
                    command += ` -B ${beforeContext}`;
                }
            }

            command += ` "${contentPattern}" ${directory}`;

            const { stdout, stderr } = await new Promise<{
                stdout: string;
                stderr: string;
            }>((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        // grep 没有找到匹配项时会返回非零退出码，这被 exec 认为是错误
                        // 但对于 grep 来说，这只是表示没有找到，不是真正的错误
                        if (error.code === 1) {
                            return resolve({ stdout: "", stderr: "" }); // 没有找到匹配项
                        }
                        return reject(error);
                    }
                    resolve({ stdout, stderr });
                });
            });

            // Grep返回的stdout就是匹配内容，不需要再分割和过滤
            if (stdout) {
                return stdout;
            } else if (stderr) {
                return `Grep completed with errors: ${stderr}`;
            } else {
                return "No matches found.";
            }
        } catch (error) {
            return `Error during grep: ${(error as Error).message}`;
        }
    },
    {
        name: "grep",
        description:
            "Searches for content within files matching a regular expression pattern.",
        schema: z.object({
            contentPattern: z
                .string()
                .describe(
                    "The regular expression pattern to search for in file contents.",
                ),
            directory: z
                .string()
                .describe("The directory to search in.")
                .default("."),
            fileGlob: z
                .string()
                .optional()
                .describe(
                    "An optional glob pattern to filter files within the specified directory (e.g., '**/*.ts').",
                ),
            caseInsensitive: z
                .boolean()
                .optional()
                .describe("Perform a case-insensitive search (-i).")
                .default(false),
            invertMatch: z
                .boolean()
                .optional()
                .describe(
                    "Invert the sense of matching, to select non-matching lines (-v).",
                )
                .default(false),
            extendedRegexp: z
                .boolean()
                .optional()
                .describe("Use extended regular expressions (-E).")
                .default(false),
            wordRegexp: z
                .boolean()
                .optional()
                .describe(
                    "Select only those matches that form whole words (-w).",
                )
                .default(false),
            showLineNumbers: z
                .boolean()
                .optional()
                .describe(
                    "Prefix each line of output with the 1-based line number within its input file (-n).",
                )
                .default(false),
            afterContext: z
                .number()
                .optional()
                .describe(
                    "Print NUM lines of trailing context after matching lines (-A NUM).",
                ),
            beforeContext: z
                .number()
                .optional()
                .describe(
                    "Print NUM lines of leading context before matching lines (-B NUM).",
                ),
            context: z
                .number()
                .optional()
                .describe(
                    "Print NUM lines of context before and after matching lines (-C NUM).",
                ),
        }),
    },
);

const READFILE_MAX_LINES = 500;
const READFILE_MAX_SIZE_BYTES = 1024 * 1024; // 1MB
const IGNORED_EXTENSIONS = new Set([
    ".DS_Store",
    ".exe",
    ".dll",
    ".so",
    ".a",
    ".o",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".tiff",
    ".ico",
    ".mp3",
    ".wav",
    ".flac",
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".zip",
    ".tar",
    ".gz",
    ".bz2",
    ".7z",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".db",
    ".sqlite",
    ".sqlite3",
    ".log",
    ".lock",
]);

export const createReadFileTool = (baseDir: string) =>
    tool(
        async ({ file }: { file: string }) => {
            try {
                const ext = path.extname(file);
                if (IGNORED_EXTENSIONS.has(ext)) {
                    return `File type (${ext}) is ignored. Cannot read file.`;
                }

                const filePath = path.join(baseDir, file);

                const stats = await fs.stat(filePath);
                if (stats.size > READFILE_MAX_SIZE_BYTES) {
                    return `File is too large (${stats.size} bytes). Cannot read file.`;
                }

                const content = await fs.readFile(filePath, "utf-8");
                const lines = content.split("\n");
                if (lines.length > READFILE_MAX_LINES) {
                    lines.splice(READFILE_MAX_LINES);
                    return (
                        lines.join("\n") +
                        `\n... (file truncated at ${READFILE_MAX_LINES} lines)`
                    );
                }

                return content;
            } catch (error) {
                return `Error reading file: ${(error as Error).message}`;
            }
        },
        {
            name: "readFile",
            description: "Reads the content of a file.",
            schema: z.object({
                file: z.string().describe("The path to the file to read."),
            }),
        },
    );
