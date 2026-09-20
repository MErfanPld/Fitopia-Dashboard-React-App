# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Better layer cache: install deps first
COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .

# Bake API base URL into the Vite bundle (optional)
ARG VITE_API_BASE_URL=https://fitopiaapi.pythonanywhere.com/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Stage 2: Production nginx ───────────────────────────────────
FROM nginx:1.27-alpine AS production

RUN rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
