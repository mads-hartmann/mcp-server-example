FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# Install netcat for network connectivity checks
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
