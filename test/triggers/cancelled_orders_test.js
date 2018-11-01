const plg = require('pluga-plg');
const expect = require('chai').expect;

const trigger = require('../../lib/triggers/cancelled_orders');

const event = {
  meta: {
    baseURI: process.env.BASE_URI,
    lastReqAt: new Date() - (15 * 60 * 1000) // 15 minutes ago
  },
  auth: {
    chave_api: process.env.CHAVE_API,
    chave_aplicacao: process.env.CHAVE_APLICACAO
  }
};

describe('Trigger: Cancelled Orders', function () {
  it('get last cancelled updated orders', function (done) {
    trigger.handle(plg, event).then((orders) => {
      expect(orders).to.be.an('array');
      expect(orders[0].numero).to.be.an('object');
      expect(orders[0].numero.numero).to.be.a('number');
      done();
    }).catch(done);
  });
});
