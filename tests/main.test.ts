import sinon from 'sinon';
import cp from 'child_process';

import main from '../lib/main';

describe('lib/main', () => {
  it('without mvn env var', async () => {
    sinon.stub(cp, 'execSync').withArgs('which java').resolves("/usr/bin/java").withArgs('which mvn').throws(new Error('mvn not found'));

    assert.rejects(async () => {
      await main({ projectDir: '', saveDir: '' });
    });
  });

  // test('without mvn env var', async () => {
  //   sinon.stub(cp, 'execSync').withArgs('which java').resolves("/usr/bin/java").withArgs('which mvn').throws(new Error('mvn not found'));

  //   assert.rejects(async () => {
  //     await main({ projectDir: '', saveDir: '' });
  //   });
  // });

  // it('normal', async () => {
  //   const proc: any = new events.EventEmitter();
  //   proc.stdin = new stream.Writable();
  //   proc.stdout = <stream.Readable> new events.EventEmitter();
  //   proc.stderr = <stream.Readable> new events.EventEmitter();

  //   // const fake = sinon.fake(() => {
  //   //   setTimeout(() => {
  //   //     proc.emit('close');
  //   //   }, 5);
  //   //   return proc;
  //   // })

  //   sinon.mock(cp, 'spawn');

  //   sinon.stub(HttpProtocol.prototype, 'generateOpenApi').rejects("")
  //   assert.rejects(async () => {
  //     await main({ projectDir: '', saveDir: '' });
  //     proc.emit('close');
  //   });
  // });
});
