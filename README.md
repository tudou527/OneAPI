## OneAPI
![npm](https://img.shields.io/npm/v/oneapi-cli)
![ci](https://github.com/tudou527/oneapi/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/tudou527/oneapi/branch/master/graph/badge.svg)](https://codecov.io/gh/tudou527/oneapi)


<img src="https://raw.githubusercontent.com/tudou527/tudou527.github.io/master/src/assets/intro-banner.png" width="820" />

## 特性
<img src="https://raw.githubusercontent.com/tudou527/tudou527.github.io/master/src/assets/intro-feat.png" width="820" />

## 使用

<img src="https://github.com/tudou527/tudou527.github.io/raw/master/public/demo.gif" width="850" />

### 环境准备
* 安装 Java 环境，并设置好环境变量
  * [Oracle JDK](https://www.oracle.com/java/technologies/downloads)
  * 安装完成后执行 `java -version` 能正常打印版本表示安装成功（OneAPI 用到的 jdk 版本为 1.8.0_345）
  * OneAPI 使用 Java 解析 .java 源文件及反编译 jar 包解析三方包的中用到的类型信息

* 安装 maven
  * [Maven 下载地址](https://maven.apache.org/download.cgi) 
  * Maven 不是可执行文件，下载后需要解压使用[官方文档](https://maven.apache.org/install.html) 
  * 安装完成后，执行 `mvn -version` 能正常打印版本表示安装成功
  * 安装完成后找后端让他复制一份 [settings.xml](https://maven.apache.org/settings.html) 给你，保存到 `${user.home}/.m2/settings.xml`。没有这个文件的情况下，默认会从官方 mvn 仓库下载依赖（某些内部包可能下载不到）

### 安装 OneAPI CLI

```
npm install -g oneapi-cli
```

### CLI 相关命令

> 可以在 [CodeSandBox](https://codesandbox.io/s/oneapi-services-demo-ktyw7i?file=/src/demo/oneapi.json) 查看开源项目 [mall](https://github.com/macrozheng/mall) 的解析结果。

#### `oneapi analysis`

从 Spring 项目解析出 OneAPI schema，参数：

* -p: 必须，后端项目路径
* -o: 必须，解析结果 oneapi.json 保存目录

调用示例：
> 开源项目 [mall](https://github.com/macrozheng/mall) 执行结果结果：[CodeSandBox](https://codesandbox.io/s/oneapi-services-demo-ktyw7i?file=/src/demo/oneapi.json)

```
// 解析 mall 目录下的后端应用，并保存解析结果到 demo 文件夹(文件名默认为 oneapi.json)
oneapi analysis -p /Users/admin/workspace/mall -o /Users/admin/demo
```

#### `oneapi service`

从 OneAPI schema 生成 service 文件，参数：

* -s: 必须，上一步解析结果 oneapi.json 文件路径
* -r: 必须，Request 导入字符串(service 方法中导入的 request)
* -o: 必须，Servies 输出目录（目录下的文件在执行过程中会被清空）

调用示例：

> 开源项目 [mall](https://github.com/macrozheng/mall) 执行结果结果：[CodeSandBox](https://codesandbox.io/s/oneapi-services-demo-ktyw7i?file=/src/services/demoController.ts)

```
// 在 mall-web/src 目录下生成前端 service
oneapi service -s /Users/admin/demo/oneapi.json -r 'import request from "@/utils/request";' -o /Users/admin/workspace/mall-web/src
```

#### `oneapi openapi`

生成 OpeAPI 3.0 schema

* -s: 必须，上一步解析结果 oneapi.json 文件路径
* -o: 必须，OpenAPI schema 输出目录

调用示例，：

> 开源项目 [mall](https://github.com/macrozheng/mall) 执行结果结果：[CodeSandBox](https://codesandbox.io/s/oneapi-services-demo-ktyw7i?file=/src/demo/openapi.json)

```
// 把解析结果转换为 OpeAPI 3.0 schema（可以导入其他 API 工具使用）
oneapi openapi -s /Users/admin/demo/oneapi.json -o /Users/admin/demo
```

### 其他
* 欢迎提交 [issue](https://github.com/tudou527/oneapi/issues) 反馈解析失败的 bad case
