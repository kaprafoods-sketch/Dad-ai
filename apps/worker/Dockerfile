# Dad AI worker — build context is the repo root:
#   docker build -f apps/worker/Dockerfile -t dad-ai-worker .
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps ./apps
COPY packages ./packages
COPY prisma ./prisma
COPY tsconfig.base.json turbo.json ./
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate

ENV NODE_ENV=production
# No port — background worker consuming BullMQ queues.
CMD ["pnpm", "--filter", "@dad-ai/worker", "start"]
