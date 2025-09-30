FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc


FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

COPY tsconfig-paths-runtime.json ./tsconfig.json

CMD ["node", "-r", "tsconfig-paths/register", "dist/app.js"]