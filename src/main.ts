import path from 'path';
import fs from 'fs-extra';

const metaData: {[key: string]: JavaMeta.FileMeta} = fs.readJsonSync(path.join(__dirname, '/result.json'));

Object.keys(metaData).forEach(k => {
  console.log('>>>>> key: ', k);
});
