# ── Stage 1: Build ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala bun
RUN npm install -g bun

# Copia manifesto de dependências
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copia o código-fonte
COPY . .

# Variáveis de ambiente do Supabase (injetadas no build pelo EasyPanel via ARG)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_GROQ_API_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_GROQ_API_KEY=$VITE_GROQ_API_KEY

# Build estático (SPA puro) — usa vite.docker.config.ts para evitar
# o @cloudflare/vite-plugin embutido no @lovable.dev/vite-tanstack-config,
# que direciona o output para Cloudflare Workers em vez de dist/.
RUN ./node_modules/.bin/vite build --config vite.docker.config.ts

# ── Stage 2: Serve ────────────────────────────────────────────────────
FROM nginx:stable-alpine

# Copia os arquivos estáticos gerados
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração nginx com suporte a SPA (client-side routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
