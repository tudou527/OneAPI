import sinon from 'sinon';
import { expect } from 'chai';

// import HttpProtocol from '../../lib/http';

describe('lib/http', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('normal', () => {
    it('normal', () => {
      expect('').to.equal('');
    });
  })
});
