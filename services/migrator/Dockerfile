FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY migrate.js .
COPY migrations/ ./migrations/

CMD [ "npm", "run", "migrate:up" ]