import path from 'path';
import sinon from 'sinon';
import fsExtra from 'fs-extra';

import HttpProtocol from '../../src/http/index';
import { IHttpAdapter, ModelAdapter, ServiceAdapter } from '../../src/http/adapter/index';
import { expect } from 'chai';

describe('lib/http/index', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('normal', () => {
    sinon.stub(fsExtra, 'readJSONSync').returns({
      'com.a.b.c': {
        classPath: 'com.a.b.c',
        fileType: 'ENTRY',
        class: {},
      },
    });
    sinon.stub(ServiceAdapter.prototype, 'convert').returns({
      classPath: 'a.b',
      importDeclaration: {
        'com.a.b.c': 'c',
      },
      
    } as unknown as IHttpAdapter);
    sinon.stub(ModelAdapter.prototype, 'convert').returns({
      classPath: 'com.a.b.c',
      importDeclaration: {
        'com.a.b.c': 'c',
      }
    } as unknown as IHttpAdapter);

    const adapterList = new HttpProtocol().convert({
      filePath: path.join(__dirname, '../fixtures/oneapi-origin.json'),
    });

    expect(adapterList).to.deep.equal([
      {
        classPath: 'a.b',
        importDeclaration: { 'com.a.b.c': 'c' },
      },
      {
        classPath: 'com.a.b.c',
        importDeclaration: { 'com.a.b.c': 'c' },
      },
    ]);
  });

  it('child class', () => {
    sinon.stub(fsExtra, 'readJSONSync').returns({
      'com.a.b.c': {
        classPath: 'com.a.b.c',
        fileType: 'ENTRY',
        class: {},
      },
      'com.a.d': {
        classPath: 'com.a.d',
        fileType: 'RESOURCE',
        class: {},
      },
    });
    sinon.stub(ServiceAdapter.prototype, 'convert').returns({
      classPath: 'a.b',
      importDeclaration: {
        'com.b.e': 'e',
        'com.b.e$ec': 'ec',
      },
    } as unknown as IHttpAdapter);
    let callIndex = 0;
    sinon.stub(ModelAdapter.prototype, 'convert').callsFake(() => {
      callIndex = callIndex + 1;

      if (callIndex === 1) {
        return {
          classPath: 'com.b.e',
          importDeclaration: {
            'com.a.b.c': 'c',
          }
        } as unknown as IHttpAdapter;
      }
      if (callIndex === 2) {
        return {
          classPath: 'com.b.e$ec',
          importDeclaration: {
            'com.a.b.c': 'c',
          }
        } as unknown as IHttpAdapter;
      }
      return {
        classPath: 'com.a.b.c',
        importDeclaration: {
          'com.a.b.c': 'c',
        }
      } as unknown as IHttpAdapter;
    });

    const adapterList = new HttpProtocol().convert({
      filePath: path.join(__dirname, '../fixtures/oneapi-origin.json'),
    });

    expect(adapterList).to.be.deep.equal([
      {
        classPath: 'a.b',
        importDeclaration: { 'com.b.e': 'e', 'com.b.e$ec': 'ec' }
      },
      {
        classPath: 'com.b.e',
        importDeclaration: { 'com.a.b.c': 'c' },
      },
      {
        classPath: 'com.b.e$ec',
        importDeclaration: { 'com.a.b.c': 'c' },
      },
      {
        classPath: 'com.a.b.c',
        importDeclaration: { 'com.a.b.c': 'c' },
      }
    ]);
  });

  it('compatible old version', () => {
    sinon.stub(fsExtra, 'readJSONSync').returns({
      oneapi: {
        version: '0.5.3',
        adapterVersion: '1.0.2',
      },
      http: [
        {
          classPath: 'a.b',
          importDeclaration: { 'com.a.b.c': 'c' },
        },
        {
          classPath: 'com.a.b.c',
          importDeclaration: { 'com.a.b.c': 'c' },
        },
      ]
    });
    sinon.stub(ServiceAdapter.prototype, 'convert').returns({
      classPath: 'a.b',
      importDeclaration: {
        'com.a.b.c': 'c',
      },
      
    } as unknown as IHttpAdapter);
    sinon.stub(ModelAdapter.prototype, 'convert').returns({
      classPath: 'com.a.b.c',
      importDeclaration: {
        'com.a.b.c': 'c',
      }
    } as unknown as IHttpAdapter);

    const adapterList = new HttpProtocol().convert({
      filePath: path.join(__dirname, '../fixtures/oneapi-origin.json'),
    });

    expect(adapterList).to.deep.equal([
      {
        classPath: 'a.b',
        importDeclaration: { 'com.a.b.c': 'c' },
      },
      {
        classPath: 'com.a.b.c',
        importDeclaration: { 'com.a.b.c': 'c' },
      },
    ]);
  });
});
