'use strict';

/*
 * @see http://apidocs.strongloop.com/loopback-datasource-juggler/#datasource-prototype-autoupdate
 */
const server = require('../server/server.js');

// datasources names is provided by the gig.yaml
const datasources = ['postgresqlDs'];
datasources.forEach(name => {
  const datasource = server.dataSources[name];
  if (datasource) {
    console.log(`Updating database for datasource ${name}`);
    datasource.isActual((error, actual)  => {
      if (actual) {
        console.log('Nothing to update');
        datasource.disconnect();
      } else {
        console.log('Changes detected, updating the database');
        datasource.autoupdate((error, result)  => {
          if (error) {
            console.log('An error occured updating the database ' + error);
            throw error;
          }
          console.log('Database update done');
          datasource.disconnect();
        });
      }
    });
  }
});
