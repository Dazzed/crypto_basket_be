# Melotic API

![N|Solid](https://lh3.googleusercontent.com/ey5VIKNfoXqBDeVkeK7bo4dHWK-Dpqol1esGHyiOPKZNdpZkc8RRSI8hsCtrtpYMD7Ab7S2iUqClZ_q2Mzd7gyS5WJBxznEZiZ86DNhFwhS30ic3Q7tAS9p7rYbwaWF_4uFsNBFa)

Prerequsites:
  - Node.js version 8.9.1
  - Postgres version 9.6

# Setup
  - clone the repo
  - npm i -g yarn nodemon
  - cd api/
  - yarn
  - *node database/update.js*
  - yarn dev (to develop)

# Notes
 - yarn dev or yarn start command will automatically seed all the roles and assets to your db.
 - Refer the .env.example to know how the .env file structure should look like

# Deployment notes
 - This project uses Docker and gig cli for deployment. Make sure you have the latest version of Docker installed.
 - The .env file must be present under deploy/melotic-staging and deploy/melotic-prod.
 - to deploy to staging, run *gig deploy api staging --verbose*
 - to deploy to production, run *gig deploy api prod --verbose*