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


## 使用

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