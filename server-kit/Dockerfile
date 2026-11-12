FROM node:20-alpine
WORKDIR /app
COPY server.js index.html package.json ./
ENV PORT=3000
ENV DATA_FILE=/data/data.json
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "server.js"]
