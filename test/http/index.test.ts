import path from 'path';
import sinon from 'sinon';
import fs from 'fs-extra';
import { expect } from 'chai';

import HttpProtocol from '../../lib/http';
import { OpenApi } from '../../lib/http/output/openapi';
import { ServiceGenerator } from '../../lib/http/output/service';
import { ModelAdapter, ServiceAdapter } from '../../lib/http/adapter';

describe('lib/http/index', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('generate openapi', () => {
    it('normal', () => {
      let fakeArgs: any[];
      sinon.stub(ServiceAdapter.prototype, 'convert').returns({
        importDeclaration: {
          'com.macro.mall.dto.PmsProductAttributeCategoryItem': 'PmsProductAttributeCategoryItem',
        },
      } as any);
      sinon.stub(ModelAdapter.prototype, 'convert').returns({
        importDeclaration: {
          'com.test.demo.detail': 'Detail',
        },
      } as any);
      sinon.stub(OpenApi.prototype, 'convert').returns({ a: 'b' } as any);
      sinon.stub(fs, 'writeJSONSync').callsFake(sinon.fake((...args) => {
        fakeArgs = args;
      }));

      const httpProtocol = new HttpProtocol({
        filePath: path.join(__dirname, '../fixture/oneapi.json'),
        projectDir: __dirname,
        saveDir: __dirname,
      });
      httpProtocol.generateOpenApi();

      expect(httpProtocol.sourceClassPathMap['com.macro.mall.dto.PmsProductAttributeCategoryItem']).to.be.equal(false);
      expect(httpProtocol.sourceClassPathMap['com.test.demo.detail']).to.be.equal(false);

      expect(fakeArgs).to.deep.equal([
        path.join(__dirname, 'openapi.json'),
        { a: 'b' },
        { spaces: 2 }
      ]);
    });
  });

  describe('generate service', () => {
    it('normal', async () => {
      let fakeArgs: any;
      sinon.stub(ServiceGenerator.prototype, 'generate').callsFake(sinon.fake(async (args) => {
        fakeArgs = args;
      }));

      const httpProtocol = new HttpProtocol({
        filePath: path.join(__dirname, '../fixture/oneapi.json'),
        projectDir: __dirname,
        saveDir: __dirname,
      });

      httpProtocol.generateService();

      expect(fakeArgs).to.deep.equal([
        'com.macro.mall.dto.OmsOrderQueryParam',
        'com.macro.mall.common.api.CommonResult',
        'com.macro.mall.common.api.CommonPage',
        'com.macro.mall.model.OmsOrder',
        'com.macro.mall.dto.OmsOrderDetail',
      ]);
    });
  });
});
