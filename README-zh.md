## OneAPI
![npm](https://img.shields.io/npm/v/oneapi-cli)
![ci](https://github.com/tudou527/oneapi/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/tudou527/oneapi/branch/master/graph/badge.svg)](https://codecov.io/gh/tudou527/oneapi)

🐝 一个用于替代 Swagger/SpringFox 的 API 工具，不需要修改后端代码，也不需要启动应用（几乎能 💯 替代）

## 特性
* **零接入成本**：基于 AST 识别项目中符合规范的 API，既不需要修改后端代码，也不需要启动应用
* **代码即文档**：自动识别方法&字段中定义的 JavaDoc 作为 API 文档的描述信息（兼容 Swagger 注解）
* **易扩展**：除 RESTFul API 外，可以通过 Node 来扩展识别企业内部自定义协议，如 RPC、GraphQL 等
* **专注 API 生产**：与业界其他工具相比，OneAPI 专注于 API 生产，也支持导出 OpenAPI 协议格式数据，方便在其他工具中消费

## 安装
```
npm install -g oneapi-cli
```


## 生成 OneAPI schema

> oneapi analysis

从 Spring 项目解析出 OneAPI schema，参数：

* -p: 必须，后端项目路径
* -o: 必须，解析结果 oneapi.json 保存目录

```
// 解析 mall 目录下的后端应用，并保存解析结果到 demo 文件夹
oneapi analysis -p /Users/admin/workspace/mall -o /Users/admin/demo
```

## 在 UmiJS 中消费 OneAPI schema

OneAPI 提供了 UmiJS 插件，可以方便的从 OneAPI JSON Schema 生成前端消费的 services 及 API 文档（插件代码参考了 @umijs/plugin-openapi）。

### 安装插件

```
npm i oneapi-umijs-plugin --save
```

### 配置

`config/config.ts` 或 `.umirc.ts` 中增加插件配置：

```
plugins: [
  // 开启插件
  'oneapi-umijs-plugin',
],

oneapi: {
  // services 中导入的 request 配置
  requestLibPath: "import { request } from 'umi';",
  // 使用相对路径或在线地址
  // schemaPath: "https://oneapi.app/docs/oneapi.json",
  schemaPath: "../oneapi-site/docs/oneapi.json",
}
```

最后，在 package.json 的 scripts 中增加如下命令用于生成 services 代码：

```
"oneapi": "umi oneapi"
```

插件在开发环境下会自动添加文档路由，路径固定为：`/umi/plugin/oneapi`

<img src="https://oneapi.app/static/umijs-plugin-doc.5816000c.png" width="800"  alt="API 文档"/>


### 其他
* 欢迎提交 [issue](https://github.com/tudou527/oneapi/issues) 反馈解析失败的 bad case