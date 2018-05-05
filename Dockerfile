FROM node:carbon

WORKDIR /usr/src/app

COPY ./api/package.json /tmp/package.json
RUN cd /tmp && yarn
RUN cp -a /tmp/node_modules .

COPY ./api .
ARG NODE_ENV
RUN echo ${NODE_ENV}
COPY ./deploy/melotic-${NODE_ENV}/.env .
COPY ./deploy/melotic-${NODE_ENV}/.env api
RUN node database/update

CMD [ "npm", "start" ]
EXPOSE 3000
