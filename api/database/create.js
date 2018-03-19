'use strict';

/*
 * @see http://apidocs.strongloop.com/loopback-datasource-juggler/#datasource-prototype-automigrate
 */
const server = require('../server/server.js');

// datasources names is provided by the gig.yaml
const datasources = ['postgresqlDs'];
datasources.forEach(name => {
  const datasource = server.dataSources[name];
  if (datasource) {
    console.log(`Starting creating the database for datasource ${name}`);
    datasource.automigrate((error, result) => {
      if (error) {
        console.log('Error while creating the database ' + error);
        throw error;
      }
      console.log(`Done creating the database for datasource ${name}`);
      datasource.disconnect();
    });
  }
});
