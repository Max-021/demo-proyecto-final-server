# Dockerfile para server (api)
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
# instalar deps de producción; para builds o si necesitás dev deps quitar --only=production
RUN npm ci --only=production

COPY . .

# si tenés build step (typescript, babel) adaptá: RUN npm run build && CMD ["node","dist/index.js"]
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"]