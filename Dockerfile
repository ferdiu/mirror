######################################################
# Stage 1: build
FROM node:current-alpine AS build

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

COPY . .
RUN npm run build


######################################################
# Stage 2: production (Node runtime only)
FROM node:current-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HTTP_PORT=3000

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY public ./public

EXPOSE 3000

CMD ["node", "dist/app.js"]
