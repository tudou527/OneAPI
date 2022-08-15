import sinon from 'sinon';
import assert from 'assert';

// import HttpProtocol from '../../lib/http';

describe('lib/http', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('normal', () => {
    it('normal', () => {
      assert('' === '');
    });
  })
});
