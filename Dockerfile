# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=systemx-npm,target=/root/.npm npm ci --no-audit --no-fund
COPY index.html tsconfig*.json vite.config.ts ./
COPY dev ./dev
COPY src ./src
COPY public ./public
RUN npm run build

FROM nginx:stable-alpine
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV API_UPSTREAM=http://host.docker.internal:8080
ENV NGINX_ENTRYPOINT_WORKER_PROCESSES_AUTOTUNE=1
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=5 CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
