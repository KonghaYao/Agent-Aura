import fs from "fs";
import path from "path";
import { exec } from "child_process";

export const getRepoInfo = (repoUrl: string) => {
    const [owner, repo] =
        repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)?.slice(1) ?? [];
    return { owner, repo };
};
export const baseDir = path.join(process.cwd(), "./.deep-wiki/repo");

export interface DownloadRepoState {
    repoUrl: string;
    nodeSHA: string;
    isAnalyze: boolean;
}

/** 完成分析git仓库的流程 */
export const downloadRepoWorkflow = async (state: DownloadRepoState) => {
    const { owner, repo } = getRepoInfo(state.repoUrl);
    const unzipPath = path.join(baseDir, `${owner}/${repo}/${state.nodeSHA}`);

    try {
        console.log(`🔍 检查目录: ${unzipPath}`);
        // 检查目录是否存在且不为空
        const files = await fs.promises.readdir(unzipPath);
        if (files.length > 0) {
            console.log(`✅ 目录已存在且不为空: ${unzipPath}`);
            return { isAnalyze: true };
        }
    } catch (error) {
        console.log(`⚠️ 目录不存在或为空，将继续下载和解压: ${unzipPath}`);
        // 目录不存在，将继续执行下载和解压
    }

    // 下载数据
    const url = `https://api.github.com/repos/${owner}/${repo}/zipball/${state.nodeSHA}`;
    console.log(`⬇️ 开始下载仓库: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`❌ 下载仓库失败: ${response.statusText}`);
        throw new Error(`Failed to download repo: ${response.statusText}`);
    }
    const data = await response.arrayBuffer();
    const zipPath = path.join(baseDir, `${owner}/${repo}/${state.nodeSHA}.zip`);
    await fs.promises.mkdir(path.dirname(zipPath), { recursive: true });
    await fs.promises.writeFile(zipPath, Buffer.from(data));
    console.log(`📦 下载仓库成功，保存到: ${zipPath}`);

    // 解压数据
    console.log(`🧩 开始解压文件到: ${unzipPath}`);
    await fs.promises.mkdir(unzipPath, { recursive: true });
    await new Promise<void>((resolve, reject) => {
        exec(`unzip -o ${zipPath} -d ${unzipPath}`, (error) => {
            if (error) {
                console.error(`❌ 文件解压失败: ${error.message}`);
                return reject(error);
            }
            console.log(`✅ 文件解压成功: ${unzipPath}`);
            resolve();
        });
    });

    // 如果解压后只有一个文件夹，则将内容移动到上一级
    try {
        const files = await fs.promises.readdir(unzipPath);
        if (files.length === 1) {
            const singleDirPath = path.join(unzipPath, files[0]!);
            if ((await fs.promises.stat(singleDirPath)).isDirectory()) {
                console.log(
                    `检测到解压后只有一个文件夹，移动内容: ${singleDirPath}`,
                );
                const filesToMove = await fs.promises.readdir(singleDirPath);
                for (const file of filesToMove) {
                    await fs.promises.rename(
                        path.join(singleDirPath, file),
                        path.join(unzipPath, file),
                    );
                }
                await fs.promises.rmdir(singleDirPath);
                console.log("✅ 内容移动完成，并已删除多余的文件夹。");
            }
        }
    } catch (error) {
        console.error(`处理解压后文件时出错: ${error}`);
    }

    // 删除 zip 文件
    console.log(`🗑️ 删除临时 zip 文件: ${zipPath}`);
    await fs.promises.unlink(zipPath);
    console.log(`✅ 临时 zip 文件删除成功: ${zipPath}`);

    return { isAnalyze: false };
};
