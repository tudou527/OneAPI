import sinon from 'sinon';
import assert from 'assert';

import TypeTransfer from '../../lib/http/type-transfer';

describe('lib/http/type-transfer', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('simple java type', () => {
    it('generic type', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'T',
        classPath: '',
      });

      assert(jsType === 'T');
      assert(Object.keys(imports).length === 0);
    });

    it('normal type', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'string',
        classPath: '',
      });
      assert(jsType === 'string');
      assert(Object.keys(imports).length === 0);
    });
  })

  describe('list', () => {
    it('java.util.List<String>', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'List',
        classPath: 'java.util.List',
        items: [{
          name: 'String',
          classPath: 'java.lang.String',
        }],
      });
      assert(jsType === 'Array<string>');
      assert(Object.keys(imports).length === 0);
    });

    it('java.util.List<T>', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'List',
        classPath: 'java.util.List',
        items: [{
          name: 'T',
          classPath: '',
        }],
      });
      assert(jsType === 'Array<T>');
      assert(Object.keys(imports).length === 0);
    });

    it('java.util.List<?>', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'List',
        classPath: 'java.util.List',
        items: [{} as any],
      });
      assert(jsType === 'Array<any>');
      assert(Object.keys(imports).length === 0);
    });

    it('java.util.List<com.model.User>', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'List',
        classPath: 'java.util.List',
        items: [{
          name: 'User',
          classPath: 'com.model.User',
        }],
      });

      assert(jsType === 'Array<User>');
      assert(Object.keys(imports).length === 1);
      assert(imports['com.model.User'] === 'User');
    });

    it('java.util.Collection<com.model.User>', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'Collection',
        classPath: 'java.util.Collection',
        items: [{
          name: 'User',
          classPath: 'com.model.User',
        }],
      });

      assert(jsType === 'Array<User>');
      assert(Object.keys(imports).length === 1);
      assert(imports['com.model.User'] === 'User');
    });
  });

  describe('date', () => {
    it('normal', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'Date',
        classPath: 'java.util.Date',
      });

      assert(jsType === 'Date');
      assert(Object.keys(imports).length === 0);
    });
  });

  describe('map', () => {
    it('Map<String, com.model.User>', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'Map',
        classPath: 'java.util.Map',
        items: [
          {
            name: 'String',
            classPath: 'java.lang.String',
          },
          {
            name: 'User',
            classPath: 'com.model.User',
          }
        ],
      });

      assert(jsType === 'Map<string, User>');
      assert(Object.keys(imports).length === 1);
      assert(imports['com.model.User'] === 'User');
    });

    it('HashMap<String, com.model.Result<com.model.User>>', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'HashMap',
        classPath: 'java.util.HashMap',
        items: [
          {
            name: 'String',
            classPath: 'java.lang.String',
          },
          {
            name: 'Result',
            classPath: 'com.model.Result',
            items: [
              {
                name: 'User',
                classPath: 'com.model.User',
              }
            ]
          }
        ],
      });

      assert(jsType === 'Map<string, Result<User>>');
      assert(Object.keys(imports).length === 2);
      assert(imports['com.model.User'] === 'User');
      assert(imports['com.model.Result'] === 'Result');
    });

    it('com.google.common.collect.ForwardingMapEntry<String, Integer>', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'ForwardingMapEntry',
        classPath: 'com.google.common.collect.ForwardingMapEntry',
        items: [
          {
            name: 'String',
            classPath: 'java.lang.String',
          },
          {
            name: 'Integer',
            classPath: 'java.lang.Integer',
          }
        ],
      });

      assert(jsType === 'Map<string, number>');
      assert(Object.keys(imports).length === 0);
    });
  });

  describe('object', () => {
    it('normal', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'Object',
        classPath: 'java.lang.Object',
      });

      assert(jsType === 'any');
      assert(Object.keys(imports).length === 0);
    });
  });

  describe('multipartFile', () => {
    it('normal', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'MultipartFile',
        classPath: 'org.springframework.web.multipart.MultipartFile',
      });

      assert(jsType === 'any');
      assert(Object.keys(imports).length === 0);
    });
  });

  describe('httpServletRequest/httpServletResponse', () => {
    it('httpServletRequest', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'HttpServletRequest',
        classPath: 'javax.servlet.http.HttpServletRequest',
      });

      assert(jsType === '{ [key: string]: any }');
      assert(Object.keys(imports).length === 0);
    });

    it('httpServletResponse', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'HttpServletResponse',
        classPath: 'javax.servlet.http.HttpServletResponse',
      });

      assert(jsType === '{ [key: string]: any }');
      assert(Object.keys(imports).length === 0);
    });
  });
});
