#FROM botpress/server:v12_5_0
#WORKDIR /botpress
#CMD ["./bp"]
FROM node:10-alpine

ENV PORT 3000

RUN yarn install
 
RUN yarn build
EXPOSE 3000

CMD ["yarn", "start"]
