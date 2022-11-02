import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import stream from 'stream';
import events from 'events';
import { expect } from 'chai';
import fsExtra from 'fs-extra';
import cp from 'child_process';

import HttpProtocol from '../src/http';
import { OpenApi } from '../src/http/output/openapi';
import { ServiceGenerator } from '../src/http/output/service';
import { analysis, generateService, convertOpenApi } from '../src/index';
import { IHttpAdapter, ModelAdapter, ServiceAdapter } from '../src/http/adapter';

describe('lib/main', () => {
  beforeEach(() => {
    sinon.stub(HttpProtocol.prototype, 'convert').callsFake(sinon.fake(() => {
      return [
        { classPath: 'com.a.b', fileType: 'ENTRY', importDeclaration: { 'com.a.b.c': 'c' } },
        { classPath: 'com.a.b', fileType: 'ENTRY', importDeclaration: { 'com.a.b.d': 'd' } },
        { classPath: 'com.a.b', fileType: 'ENTRY', importDeclaration: { 'com.a.b.c': 'c' } },
      ] as unknown as IHttpAdapter[]
    }));
  });

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

    it('project dir not exists', async function() {
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

      try {
        await analysis({ projectDir: '/projectDir', saveDir: '/saveDir' });
      } catch(e) {
        expect(e.message.toString().indexOf('/projectDir 目录不存在') > 0).to.be.equal(true);
      }
    });
  
    it('normal', async function() {
      let fakeArgs: any = null;
      const proc: any = new events.EventEmitter();
      proc.stdin = new stream.Writable();
      proc.stdout = <stream.Readable> new events.EventEmitter();
      proc.stderr = <stream.Readable> new events.EventEmitter();

      sinon.stub(fs, 'existsSync').returns(true);
      sinon.replace(cp, 'spawn', sinon.fake(() => {
        setTimeout(() => {
          proc.emit('close');
        }, 5);
        return proc;
      }));
      sinon.stub(cp, 'execSync').withArgs('which java').resolves("/usr/bin/java").withArgs('which mvn').resolves("/usr/bin/mvn");
      sinon.stub(fsExtra, 'writeJSONSync').callsFake(sinon.fake((...args) => {
        fakeArgs = args;
      }));

      const result = await analysis({ projectDir: '/projectDir', saveDir: '/saveDir' });

      expect(result).to.be.equal('/saveDir/oneapi.json');

      expect(/^[\d\.]{1,}/.test(fakeArgs.at(1).oneapi.version)).to.be.equal(true);
      expect(/^[\d\.]{1,}/.test(fakeArgs.at(1).oneapi.adapterVersion)).to.be.equal(true);
    });
  });

  describe('generate service', () => {
    it('normal', async () => {
      let fakeArgs: any = [];
      
      sinon.stub(ServiceGenerator.prototype, 'generate').callsFake(sinon.fake((...args) => {
        fakeArgs.push(args);
      }));
      sinon.stub(fs, 'existsSync').callsFake(sinon.fake(() => {
        return false;
      }));

      const oneApiFilePath = generateService({
        schema: path.join(__dirname, './fixtures/oneapi-origin.json'),
        requestStr: '',
        output: __dirname,
      });

      expect(oneApiFilePath).to.be.equal(path.join(__dirname));
      expect(fakeArgs.flat().at(0)).to.deep.equal(['com.a.b.c', 'com.a.b.d']);
    });
  });

  describe('generate openapi', () => {
    it('normal', () => {
      let fakeArgs: any[] = [];
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
        schema: path.join(__dirname, './fixtures/oneapi-origin.json'),
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
