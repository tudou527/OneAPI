import { expect } from 'chai';

import { getJsDoc } from '../../../lib/http/adapter/index';

describe('lib/http/adapter/index', () => {
  it('normal', () => {
    const jsDoc = getJsDoc({
      text: '描述内容',
      tag: {
        '博客': ['http://test.com'],
        'param': ['{nick} 名称', '{name} 用户名'],
      }
    });

    expect(jsDoc.description).to.equal('描述内容');
    expect(jsDoc.tags).to.have.lengthOf(3);

    expect(jsDoc.tags[0]).to.deep.equal({
      tagName: '博客',
      text: 'http://test.com',
    });
    // 参数名称被加上 了 args. 前缀
    expect(jsDoc.tags[1]).to.deep.equal({
      tagName: 'param',
      text: 'args.{nick} 名称',
    });
    expect(jsDoc.tags[2]).to.deep.equal({
      tagName: 'param',
      text: 'args.{name} 用户名',
    });
  });

  it('desc is null', () => {
    const jsDoc = getJsDoc(null as unknown as JavaMeta.Description);

    expect(jsDoc).to.deep.equal({
      description: '',
      tags: [],
    });
  });

  it('description text and tag both null', () => {
    const jsDoc = getJsDoc({ text: null, tag: {} });

    expect(jsDoc).to.deep.equal({
      description: '',
      tags: [],
    });
  });

  it('description text is null', () => {
    const jsDoc = getJsDoc({
      text: undefined,
      tag: {
        '博客': ['http://test.com'],
        'param': ['{nick} 名称', '{name} 用户名'],
      }
    });

    expect(jsDoc.description).to.equal('');
    expect(jsDoc.tags).to.have.lengthOf(3);
  });

  describe('use swagger annotation', () => {
    it('@ApiModelProperty', () => {
      const desc = {
        text: 'test',
        tag: {},
      };
      const annotations = [
        {
          "name": "ApiModelProperty",
          "classPath": "io.swagger.annotations.ApiModelProperty",
          "fields": [
            {
              "name": "value",
              "type": "Constant",
              "isArray": false,
              "value": "是否进行显示"
            }
          ]
        },
      ];

      const jsDoc = getJsDoc(desc, annotations);

      expect(jsDoc).to.deep.equal({
        description: '是否进行显示',
        tags: [],
      });
    });

    it('@ApiModelProperty field is null', () => {
      const desc = {
        text: 'test',
        tag: {},
      };
      const annotations = [
        {
          "name": "ApiModelProperty",
          "classPath": "io.swagger.annotations.ApiModelProperty",
          "fields": null
        },
      ];

      const jsDoc = getJsDoc(desc, annotations);

      expect(jsDoc).to.deep.equal({
        description: 'test',
        tags: [],
      });
    });

    it('@Api(descriptions)', () => {
      const desc = {
        text: 'test',
        tag: {},
      };
      const annotations = [
        {
          "name": "Apis",
          "classPath": "io.swagger.annotations.ApiModelProperty",
          "fields": [
            {
              "name": "descriptions",
              "type": "Constant",
              "isArray": false,
              "value": "是否进行显示"
            }
          ]
        },
      ];

      const jsDoc = getJsDoc(desc, annotations);

      expect(jsDoc).to.deep.equal({
        description: '是否进行显示',
        tags: [],
      });
    });

    it('@Api(value)', () => {
      const desc = {
        text: 'test',
        tag: {},
      };
      const annotations = [
        {
          "name": "Apis",
          "classPath": "io.swagger.annotations.ApiModelProperty",
          "fields": [
            {
              "name": "value",
              "type": "Constant",
              "isArray": false,
              "value": "是否进行显示"
            }
          ]
        },
      ];

      const jsDoc = getJsDoc(desc, annotations);

      expect(jsDoc).to.deep.equal({
        description: '是否进行显示',
        tags: [],
      });
    });

    it('@Api(value) field is null', () => {
      const desc = {
        text: 'test',
        tag: {},
      };
      const annotations = [
        {
          "name": "Apis",
          "classPath": "io.swagger.annotations.ApiModelProperty",
          "fields": null
        },
      ];

      const jsDoc = getJsDoc(desc, annotations);

      expect(jsDoc).to.deep.equal({
        description: 'test',
        tags: [],
      });
    });
  });
});
