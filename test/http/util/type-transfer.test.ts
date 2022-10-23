import sinon from 'sinon';
import { expect } from 'chai';

import TypeTransfer from '../../../src/http/util/type-transfer';

describe('lib/http/util/type-transfer', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('simple java type', () => {
    it('generic type', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'T',
        classPath: '',
      });

      expect(jsType).to.equal('T');
      expect(Object.keys(imports)).to.have.lengthOf(0);
    });

    it('normal type', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'string',
        classPath: '',
      });
      expect(jsType).to.equal('string');
      expect(Object.keys(imports)).to.have.lengthOf(0);
    });

    it('classPath is null', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'Map',
        classPath: null,
      });

      expect(jsType).to.equal('Map');
      expect(imports).to.deep.equal({ null: 'Map' });
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
      expect(jsType).to.equal('Array<string>');
      expect(Object.keys(imports)).to.have.lengthOf(0);
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
      expect(jsType).to.equal('Array<T>');
      expect(Object.keys(imports)).to.have.lengthOf(0);
    });

    it('java.util.List<?>', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'List',
        classPath: 'java.util.List',
        items: [{} as any],
      });
      expect(jsType).to.equal('Array<any>');
      expect(Object.keys(imports)).to.have.lengthOf(0);
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

      expect(jsType).to.equal('Array<User>');
      expect(Object.keys(imports)).to.have.lengthOf(1);
      expect(imports['com.model.User']).to.equal('User');
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

      expect(jsType).to.equal('Array<User>');
      expect(Object.keys(imports)).to.have.lengthOf(1);
      expect(imports['com.model.User']).to.equal('User');
    });
  });

  describe('date', () => {
    it('normal', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'Date',
        classPath: 'java.util.Date',
      });

      expect(jsType).to.equal('Date');
      expect(Object.keys(imports)).to.have.lengthOf(0);
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

      expect(jsType).to.equal('Map<string, User>');
      expect(Object.keys(imports)).to.have.lengthOf(1);
      expect(imports['com.model.User']).to.equal('User');
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

      expect(jsType).to.equal('Map<string, Result<User>>');
      expect(Object.keys(imports)).to.have.lengthOf(2);
      expect(imports['com.model.User']).to.equal('User');
      expect(imports['com.model.Result']).to.equal('Result');
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

      expect(jsType).to.equal('Map<string, number>');
      expect(Object.keys(imports)).to.have.lengthOf(0);
    });
  });

  describe('object', () => {
    it('normal', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'Object',
        classPath: 'java.lang.Object',
      });

      expect(jsType).to.equal('any');
      expect(Object.keys(imports)).to.have.lengthOf(0);
    });
  });

  describe('multipartFile', () => {
    it('normal', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'MultipartFile',
        classPath: 'org.springframework.web.multipart.MultipartFile',
      });

      expect(jsType).to.equal('any');
      expect(Object.keys(imports)).to.have.lengthOf(0);
    });
  });

  describe('custom class', () => {
    it('normal', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'OmsOrderQueryParam',
        classPath: 'com.macro.mall.dto.OmsOrderQueryParam',
      });
      
      expect(jsType).to.equal('OmsOrderQueryParam');
      expect(imports).to.deep.equal({
        'com.macro.mall.dto.OmsOrderQueryParam': 'OmsOrderQueryParam',
      });
    });
  });

  describe('httpServletRequest/httpServletResponse', () => {
    it('httpServletRequest', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'HttpServletRequest',
        classPath: 'javax.servlet.http.HttpServletRequest',
      });

      expect(jsType).to.equal('{ [key: string]: any }');
      expect(Object.keys(imports)).to.have.lengthOf(0);
    });

    it('httpServletResponse', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'HttpServletResponse',
        classPath: 'javax.servlet.http.HttpServletResponse',
      });

      expect(jsType).to.equal('{ [key: string]: any }');
      expect(Object.keys(imports)).to.have.lengthOf(0);
    });
  });

  describe('sub class', () => {
    it('normal', () => {
      const { jsType, imports } = new TypeTransfer().transform({
        name: 'CalcAmount',
        classPath: 'com.macro.mall.portal.domain.ConfirmOrderResult$CalcAmount',
      });

      expect(jsType).to.equal('ConfirmOrderResultCalcAmount');
      expect(imports).to.deep.equal({
        'com.macro.mall.portal.domain.ConfirmOrderResult$CalcAmount': 'ConfirmOrderResultCalcAmount',
      });
    });
  });
});
