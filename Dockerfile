FROM node:24-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY . .
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /app

RUN apk add --no-cache tini

COPY --from=build /app/.output ./.output
COPY --from=build /app/scripts ./scripts
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

RUN chmod +x scripts/docker-entrypoint.sh

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "scripts/docker-entrypoint.sh"]
