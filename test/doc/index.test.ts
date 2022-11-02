import http from 'http';
import sinon from 'sinon';
import * as path from 'path';
import { expect } from 'chai';
import * as util from '../../src/utils/common';

import { showDoc } from '../../src/doc';

describe('src/doc/index', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('showDoc', () => {
    it('schema not exist', async () => {
      try {
        await showDoc({ schema: '' });
      } catch(e) {
        expect(e.message.includes('不存在')).to.be.equal(true);
      }
    });

    it('normal', async () => {
      let data: any[] = [];
      let res = {
        writeHead: (...args: any) => {
          data.push(args);
        },
        end: (str: string) => {
          data.push(str);
        }
      }
      sinon.stub(http, 'createServer').callsFake(sinon.fake((args: any) => {
        args({}, res);
        return {
          listen: () => {},
        } as any;
      }));
      sinon.stub(util, 'getUnUsedPort').returns(3002);

      const url = await showDoc({ schema: path.join(__dirname, '../fixtures/oneapi.json') });
      expect(url).to.be.equal('http://127.0.0.1:3002/docs');

      expect(data[0]).to.be.deep.equal([200, { 'Content-Type': 'text/html' }]);
      expect(data[1].includes('{jsonSchema}')).to.be.equal(false);
    });
  });
});