FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@11.20.0

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc* ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN pnpm install

# Build
RUN pnpm build

# Expose ports
EXPOSE 3001 3100

# Start apps based on SERVICE env var
CMD if [ "$SERVICE" = "web" ]; then \
      pnpm --filter @vonveria-swim/web start; \
    elif [ "$SERVICE" = "api" ]; then \
      pnpm --filter @vonveria-swim/api start:prod; \
    else \
      pnpm --filter @vonveria-swim/worker start; \
    fi
