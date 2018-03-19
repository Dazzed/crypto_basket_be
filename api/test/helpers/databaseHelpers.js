// Test helpers that can eventually be in a Loopback test module.
const resetDB = app => new Promise((resolve) => {
  app.dataSources.db.automigrate(resolve);
});

// Set globals.
global.resetDB = resetDB;
