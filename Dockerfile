FROM node:carbon
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
# Bundle app source

COPY ./api .

ARG NODE_ENV
RUN echo ${NODE_ENV}
COPY ./deploy/melotic-${NODE_ENV}/.env .
COPY ./deploy/melotic-${NODE_ENV}/.env api
RUN npm install
RUN node database/update
# RUN node database/update.js
# ENV ESHOST=https://api:tE7h7NdTBmM44d8IKxEde7Kk4DfQVeiP@aws-us-east-1-portal.11.dblayer.com:16140/
# # If you are building your code for production
# # RUN npm install --only=production

CMD [ "npm", "start" ]
EXPOSE 3000