'use strict';

module.exports = {
  postgresqlDs: {
    connector: 'postgresql',
    host: process.env.DATABASE_POSTGRESQL_HOST,
    port: process.env.DATABASE_POSTGRESQL_PORT,
    database: process.env.DATABASE_POSTGRESQL_DATABASE,
    user: process.env.DATABASE_POSTGRESQL_USER,
    password: process.env.DATABASE_POSTGRESQL_PASSWORD,
  },
};
