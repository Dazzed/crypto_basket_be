// Libraries
const supertest = require('supertest');
const server = require('../../../server/server');

/**
 * This is testing the explorer redirect.
 */
describe('GET /explorer', () => {

  // --------------------------------------------------
  // Initialize
  // --------------------------------------------------
  set('app', () => server);

  // --------------------------------------------------
  // Request
  // --------------------------------------------------
  set('url', () => '/explorer');
  action('request', () => supertest(app).get(url));

  beforeEach(async () => {
    response = await request();
  });

  it('should return a 301 (redirect)', () => {
    expect(response.status).toEqual(301);
  });
});

/**
 * This is testing the explorer presence.
 */
describe('GET /explorer/', () => {
  
    // --------------------------------------------------
    // Initialize
    // --------------------------------------------------
    set('app', () => server);
  
    // --------------------------------------------------
    // Request
    // --------------------------------------------------
    set('url', () => '/explorer/');
    action('request', () => supertest(app).get(url));
  
    beforeEach(async () => {
      response = await request();
    });
  
    it('should return a 200', () => {
      expect(response.status).toEqual(200);
    });
  });
