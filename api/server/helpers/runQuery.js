const server = require('../server');
const { connector } = server.datasources.mysqlDs;

module.exports = query =>
  new Promise((resolve, reject) =>
    connector.query(query, (err, result) => err ? reject(err) : resolve(result)));
