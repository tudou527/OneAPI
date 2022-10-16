## OneAPI
![npm](https://img.shields.io/npm/v/oneapi-cli)
![ci](https://github.com/tudou527/oneapi/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/tudou527/oneapi/branch/master/graph/badge.svg)](https://codecov.io/gh/tudou527/oneapi)

### 🇨🇳 [中文文档](./README-zh.md)

🐝 An API production tool that can replace Swagger/SpringFox 💯 without modifying the back-end code or starting the application

## Features
* **Zero cost**: Based on AST to identify the APIs that conform to the specifications in the project, neither the back-end code needs to be modified nor the application needs to be started.
* **Code is Document**: Automatically identify JavaDoc defined in methods & fields as description information of API documents (compatible with Swagger annotations)
* **Easy to extend**: In addition to the RESTFul API, Node can be extended to identify custom protocols within the enterprise, such as RPC, GraphQL, etc.
* **Focus on API production**: Compared with other tools in the industry, OneAPI focuses on API production, and also supports the export of OpenAPI protocol format data, which is convenient for consumption in other tools

## Install

```
npm install -g oneapi-cli
```

## Usage

#### `oneapi analysis`

Parse the OneAPI schema from the Spring project, parameters:

* `-p`: Required, backend project path
* `-o`: Required, the parsing result oneapi.json is saved in the directory

Example:
```
oneapi analysis -p /Users/admin/workspace/mall -o /Users/admin/demo
```

#### `oneapi service`

Generate service file from OneAPI schema, parameters:

* `-s`: Required, the oneapi.json file path of the parsing result in the previous step
* `-r`: Required, Request import string (request imported in service method)
* `-o`: Required, Servies output directory (the files in the directory will be emptied during execution)

Example:

```
oneapi service -s /Users/admin/demo/oneapi.json -r 'import request from "@/utils/request";' -o /Users/admin/workspace/mall-web/src
```

#### `oneapi openapi`

Generate OpeAPI 3.0 schema

* `-s`: Required, the oneapi.json file path of the parsing result in the previous step
* `-o`: Required, OpenAPI schema output directory

Example:
```
oneapi openapi -s /Users/admin/demo/oneapi.json -o /Users/admin/demo
```

### Other
* Welcome to submit an issue to report the bad case of failed parsing