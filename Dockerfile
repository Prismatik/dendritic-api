FROM node:latest

WORKDIR /app

COPY ./package.json /app

RUN NODE_ENV=null npm install
RUN npm cache clean

ADD . /app
