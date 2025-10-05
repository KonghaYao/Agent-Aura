import { exec as callbackExec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const exec = util.promisify(callbackExec);

interface TreeOptions {
    level?: number;
    ignore?: string[];
}

export const createTreeCommand = (baseDir: string) => {
    return async (
        dirPath: string,
        options: TreeOptions = {},
    ): Promise<string> => {
        const args = [dirPath];
        if (options.level) {
            args.push(`-L ${options.level}`);
        }
        if (options.ignore) {
            args.push(`-I '${options.ignore.join("|")}'`);
        }
        try {
            const { stdout } = await exec(
                `cd ${baseDir} && tree ${args.join(" ")}`,
            );
            return stdout;
        } catch (error) {
            // 如果目录不存在或者tree命令执行失败，返回空字符串而不是抛出错误
            console.error(
                `Error executing tree command for ${dirPath}: ${
                    (error as Error).message
                }`,
            );
            return `Error executing tree command for ${dirPath}: ${
                (error as Error).message
            }`;
        }
    };
};
