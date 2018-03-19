// Libraries
const supertest = require('supertest');
const server = require('../../../server/server');

/**
 * This is testing the ping presence.
 */
describe('GET /ping', () => {
  
    // --------------------------------------------------
    // Initialize
    // --------------------------------------------------
    set('app', () => server);
  
    // --------------------------------------------------
    // Request
    // --------------------------------------------------
    set('url', () => '/ping');
    action('request', () => supertest(app).get(url));
  
    beforeEach(async () => {
      response = await request();
    });
  
    it('should return a 200', () => {
      expect(response.status).toEqual(200);
      expect(response.body.started).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });
