# 构建阶段
FROM oven/bun:1.2.16 AS builder

# 创建应用目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (如果存在)
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN bun install --registry=https://registry.npmmirror.com

COPY src ./src

# 编译 TypeScript
RUN bun run build

# # 生产阶段
FROM oven/bun:1.2.16-alpine AS production

# 创建应用目录
WORKDIR /app

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist /app/dist

WORKDIR /app/dist

# 启动应用
CMD ["bun", "index.js"]