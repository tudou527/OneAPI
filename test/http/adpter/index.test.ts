import { expect } from 'chai';

import { getJsDoc } from '../../../lib/http/adapter/index';

describe('lib/http/adapter/index', () => {
  it('desc is null', () => {
    const jsDoc = getJsDoc(null as unknown as JavaMeta.Description);

    expect(jsDoc).to.equal(null);
  });

  it('description text and tag both null', () => {
    const jsDoc = getJsDoc({ text: null, tag: {} });

    expect(jsDoc).to.equal(null);
  });

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
});
