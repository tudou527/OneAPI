import path from 'path';
import * as net from 'net';

/**
 * 返回完整路径
 */
export const getAbsolutePath = (relativePath: string) => {
  if (!relativePath.startsWith('/')) {
    return path.join(process.cwd(), relativePath);
  }

  return relativePath;
}

// 检测端口是否可用
export const getUnUsedPort = async function(port: number){
  const portUsed = async function(port: number){
    return new Promise((resolve)=>{
      const server = net.createServer().listen(port);
      server.on('listening',function(){
        server.close();
        resolve(port);
      });
      server.on('error',function(err: any){
        if(err.code == 'EADDRINUSE'){
          resolve(err);
        }
      });             
    });
  }

  const res = await portUsed(port);
  if(res instanceof Error){
    port++;
    return getUnUsedPort(port);
  }else{
    return port;
  }
}
