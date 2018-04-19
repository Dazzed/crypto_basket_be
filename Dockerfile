FROM node:carbon
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
# Bundle app source


COPY ./api/package-checkpoint.json ./package.json
RUN npm install
COPY ./api/package.json ./package.json
RUN npm install
ARG NODE_ENV
RUN echo ${NODE_ENV}
COPY ./api .
COPY ./deploy/melotic-${NODE_ENV}/.env .
RUN node database/update

CMD [ "npm", "start" ]
EXPOSE 3000