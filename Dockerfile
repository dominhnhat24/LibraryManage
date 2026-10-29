# Build the reader/admin SPA with a same-origin API URL.
FROM node:22-alpine AS web-build
WORKDIR /app/admin-web
COPY admin-web/package.json admin-web/package-lock.json ./
RUN npm ci
COPY admin-web/ ./
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Keep the runtime image limited to production dependencies and server files.
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server.js ./server.js
COPY src/ ./src/
COPY admin-web/public/ ./admin-web/public/
COPY --from=web-build /app/admin-web/dist/ ./admin-web/dist/
EXPOSE 10000
CMD ["npm", "start"]
