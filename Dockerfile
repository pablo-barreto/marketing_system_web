# ==========================================
# 1. Base Image: Dependencias
# ==========================================
FROM node:20-alpine AS base

# Instalar dependencias necesarias para libc (a veces requeridas por librerías de Next.js)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de gestión de paquetes
COPY package.json package-lock.json* ./

# Instalar dependencias (npm ci es más rápido y seguro para CI/CD)
RUN npm install

# ==========================================
# 2. Builder Image: Construcción
# ==========================================
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .

# --- CONFIGURACIÓN DEL BACKEND ---
# Definimos la URL de tu Cloud Run aquí para que Next.js la compile en el frontend
ENV NEXT_PUBLIC_API_URL="https://marketing-system-848362500920.us-central1.run.app"

# Deshabilitar telemetría de Next.js para acelerar el build
ENV NEXT_TELEMETRY_DISABLED 1

# Construir la aplicación
RUN npm run build

# ==========================================
# 3. Runner Image: Producción
# ==========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Crear usuario 'nextjs' por seguridad (no correr como root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar solo los archivos necesarios para ejecutar en modo Standalone
# Esto reduce drásticamente el tamaño de la imagen (de >1GB a ~150MB)
COPY --from=builder /app/public ./public

# Copiamos el build standalone y los estáticos
# NOTA: Asegúrate de tener output: 'standalone' en tu next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]