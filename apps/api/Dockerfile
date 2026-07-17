# Dad AI API — build context is the repo root:
#   docker build -f apps/api/Dockerfile -t dad-ai-api .
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# Install workspace deps (cached on lockfile changes).
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps ./apps
COPY packages ./packages
COPY prisma ./prisma
COPY tsconfig.base.json turbo.json ./
RUN pnpm install --frozen-lockfile

# Generate the Prisma client into packages/db/generated.
RUN pnpm db:generate

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
# Runs TypeScript directly via the SWC loader (NestJS decorators need it).
CMD ["pnpm", "--filter", "@dad-ai/api", "start"]
