import fs from 'fs-extra';
import sinon from 'sinon';
import path from 'path';
import stream from 'stream';
import events from 'events';
import { expect } from 'chai';
import fsExtra from 'fs-extra';
import cp from 'child_process';

import { OpenApi } from '../lib/http/output/openapi';
import { ServiceGenerator } from '../lib/http/output/service';
import { ModelAdapter, ServiceAdapter } from '../lib/http/adapter';
import { analysis, generateService, convertOpenApi } from '../lib/main';

describe('lib/main', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('analysis', () => {
    it('without java env var', function() {
      return new Promise(async (resolve) => {
        sinon.stub(cp, 'execSync').withArgs('which java').throws(new Error('mvn not found'));
  
        try {
          await analysis({ projectDir: '', saveDir: '' });
        } catch(e) {
          expect(e.message).to.include('Java');
        }
  
        resolve('');
      });
    });
  
    it('without mvn env var', function() {
      return new Promise(async (resolve) => {
        sinon.stub(cp, 'execSync').withArgs('which java').resolves("/usr/bin/java").withArgs('which mvn').throws(new Error('mvn not found'));
  
        try {
          await analysis({ projectDir: '', saveDir: '' });
        } catch(e) {
          expect(e.message).to.include('Maven');
        }
  
        resolve('');
      });
    });
  
    it('normal', async function() {
      const proc: any = new events.EventEmitter();
      proc.stdin = new stream.Writable();
      proc.stdout = <stream.Readable> new events.EventEmitter();
      proc.stderr = <stream.Readable> new events.EventEmitter();

      sinon.replace(cp, 'spawn', sinon.fake(() => {
        setTimeout(() => {
          proc.emit('close');
        }, 5);
        return proc;
      }));
      sinon.stub(cp, 'execSync').withArgs('which java').resolves("/usr/bin/java").withArgs('which mvn').resolves("/usr/bin/mvn");

      const result = await analysis({ projectDir: '/projectDir', saveDir: '/saveDir' });

      expect(result).to.be.equal('/saveDir/oneapi.json');
    });
  });

  describe('generate service', () => {
    it('normal', async () => {
      let fakeArgs: any;
      sinon.stub(ServiceGenerator.prototype, 'generate').callsFake(sinon.fake(async (args) => {
        fakeArgs = args;
      }));
      sinon.stub(fs, 'existsSync').callsFake(sinon.fake(() => {
        return false;
      }));

      const oneApiFilePath = generateService({
        schema: path.join(__dirname, './fixture/oneapi.json'),
        requestStr: '',
        output: __dirname,
      });

      expect(oneApiFilePath).to.be.equal(path.join(__dirname, '/services'));
      expect(fakeArgs).to.deep.equal([
        'com.macro.mall.dto.OmsOrderQueryParam',
        'com.macro.mall.common.api.CommonResult',
        'com.macro.mall.common.api.CommonPage',
        'com.macro.mall.model.OmsOrder',
        'com.macro.mall.dto.PmsProductAttributeCategoryItem',
        'com.macro.mall.portal.domain.OmsOrderDetail',
        'com.macro.mall.dto.OmsOrderQueryParam$CalcAmount',
        'com.macro.mall.model.PmsProductAttribute',
        'com.macro.mall.model.PmsProductAttributeCategory',
      ]);
    });
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
      sinon.stub(fsExtra, 'writeJSONSync').callsFake(sinon.fake((...args) => {
        fakeArgs = args;
      }));

      const openApiFilePath = convertOpenApi({
        schema: path.join(__dirname, './fixture/oneapi.json'),
        output: __dirname,
      });

      expect(openApiFilePath).to.be.equal(path.join(__dirname, 'openapi.json'));
      expect(fakeArgs).to.deep.equal([
        path.join(__dirname, 'openapi.json'),
        { a: 'b' },
      ]);
    });
  });
});
