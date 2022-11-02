import sinon from 'sinon';
import net from 'net';
import { expect } from 'chai';
import { getAbsolutePath, getUnUsedPort } from '../../src/utils/common';

describe('lib/utils/common', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getAbsolutePath', () => {
    it('relative path', () => {
      const absPath = getAbsolutePath('');
      expect(absPath.startsWith('/')).to.be.equal(true);
    });

    it('absolute path', () => {
      const absPath = getAbsolutePath('/Users/test/xxx');
      expect(absPath).to.be.equal('/Users/test/xxx');
    });
  });

  describe('getUnUsedPort', () => {
    it('normal', async () => {
      const port = await getUnUsedPort(3000);
      expect(port).to.be.equal(3000);
    });

    it('port in use', async () => {
      const socketStub: any = sinon.stub();
      socketStub.on = sinon.stub();
      socketStub.destroy = sinon.stub();

      sinon.stub(net, 'createServer').returns({
        listen: (port: number) => {
          return {
            on: (msg: string, callback: any) => {
              if (msg === 'error' && port === 3000) {
                const err: any = new Error();
                err.code = 'EADDRINUSE';
                callback(err);
              }
              if (port === 3001) {
                callback();
              }
            },
            close: () => {},
          }
        },
      } as any);
      const port = await getUnUsedPort(3000);
      expect(port).to.be.equal(3001);
    });
  });
});