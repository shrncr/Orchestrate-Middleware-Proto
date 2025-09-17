FROM node:latest

WORKDIR /middleware

COPY ./package.json /middleware/
COPY ./src /middleware/src

RUN npm install

EXPOSE 3000

CMD ["npm", "run", "start"]