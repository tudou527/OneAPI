import { expect } from 'chai';
import { getAbsolutePath } from '../../lib/utils/common';

describe('lib/utils/common', () => {
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
});