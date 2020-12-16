FROM node:10.18-alpine
#WORKDIR /botpress
#CMD ["./bp"]
#FROM node:10-alpine

ENV PORT 3000

RUN mkdir -p /usr/src/app 
WORKDIR /usr/src/app
 
COPY package*.json /usr/src/app

RUN yarn install
 
COPY . /usr/src/app

RUN yarn build
EXPOSE 3000

CMD ["yarn", "start"]
