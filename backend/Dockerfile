# Multi-stage Dockerfile
# -----------------------------
# Stage 1: Build
# -----------------------------
FROM node:18 AS builder

# Working directory
WORKDIR /usr/src/app

# Copy package files and tsconfig
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm install --save wait-port

# Copy source code
COPY src ./src

# Compile TypeScript
RUN npm run build

# -----------------------------
# Stage 2: Runtime
# -----------------------------
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# 🔹 Aggiunta minima: ImageMagick per watermark immagini
RUN apt-get update && apt-get install -y --no-install-recommends \
    imagemagick \
 && rm -rf /var/lib/apt/lists/*

# Copy necessary files from the builder stage
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# RICORDARE DI ELIMINARE QUESTA RIGA
COPY --from=builder /usr/src/app/src ./src

# 🔹 Aggiunta minima: copia font nel percorso richiesto
# (assicurati che nel progetto esista la cartella "fonts" con DejaVuSans.ttf)
COPY fonts/ ./fonts/

# 🔹 Aggiunta minima: cartella tmp per i file generati on-the-fly
RUN mkdir -p /usr/src/app/tmp

# Expose the application port
EXPOSE 3000

# Staerting command with wait-port to ensure DB is ready
CMD ["sh", "-c", "npx wait-port $DB_HOST:$DB_PORT && npm start"]