# =========================
# 1️⃣ Build stage
# =========================
FROM node:20-alpine AS builder

# Activer pnpm (version identique à package.json)
RUN corepack enable && corepack prepare pnpm@10.18.1 --activate

WORKDIR /app

# Copier uniquement les fichiers nécessaires aux deps
COPY package.json pnpm-lock.yaml ./

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier le reste du projet
COPY . .

# Build Next.js (production)
RUN pnpm build


# =========================
# 2️⃣ Runtime stage (léger)
# =========================
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10.18.1 --activate

WORKDIR /app

# Copier l'app buildée
COPY --from=builder /app ./

ENV NODE_ENV=production

# Port standard Next.js (Dokploy injecte le vrai port)
EXPOSE 3000

# Lancer l'application
CMD ["pnpm", "start"]
