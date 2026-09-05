FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5001

CMD ["sh", "-c", "npx prisma db push && npm run db:seed && npm start"]
