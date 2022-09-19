/**
 * 适配 OpenAPI3.0 协议
 */
import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';

import TypeTransfer from '../util/type-transfer';
import { IAdapterField, IHttpAdapter, IHttpAdapterService } from '../adapter';

export class OpenApi {
  projectDir: string;
  openApi = {
    openapi: '3.0.0',
    info: {
      title: 'title',
      version: '',
      description: 'Teambition Core API',
    },
    paths: {},
    components: {
      schemas: {},
    },
  };
  // 转换结果
  httpAdapter: IHttpAdapter[] = [];

  constructor(args: { httpAdapter: IHttpAdapter[], projectDir: string }) {
    this.projectDir = args.projectDir;
    this.httpAdapter = args.httpAdapter;
  }

  convert() {
    this.updateInfo();
    this.addPath();
    this.addComponents();

    return this.openApi;
  }

  private updateInfo () {
    // 尝试读取根目录下的 pom.xml 获取应用信息
    const pom = this.projectDir + '/pom.xml';

    // 默认使用目录名作为 title
    let title = this.projectDir.split('/').reverse()[0];
    let version = '';

    if (fs.existsSync(pom)) {
      try {
        const parser = new XMLParser({ ignoreAttributes: false });
        const jsonData = parser.parse(fs.readFileSync(pom, 'utf8'));

        title = jsonData?.project?.artifactId || title;
        version = jsonData?.project?.vertion || version;

      } catch(_e){
      }
    }

    this.openApi.info = {
      title,
      version,
      description: `${title} API`
    }
  }

  private addPath() {
    const { httpAdapter } = this;

    httpAdapter.filter(adapter => adapter.fileType === 'ENTRY').forEach(adapter => {
      adapter.services?.forEach(service => {
        this.openApi.paths[service.url]  = {
          [service.type.toLowerCase()]: {
            tags: [adapter.className],
            operationId: service.operationId,
            summary: service.description?.description || '',
            description: service.description?.description || '',
            ...this.getParameters(service),
            responses: this.getResponse(service.response)
          },
        }
      });
    });
  }

  private addComponents() {
    const { httpAdapter, openApi } = this;
    const components = openApi.components.schemas;

    httpAdapter.filter(adapter => adapter.fileType !== 'ENTRY').forEach(adapter => {
      if (!components[adapter.className]) {
        const properties = {};
        adapter.fields.forEach(f => {
          properties[f.name] = {
            description: f.description?.description || '',
            ...this.getSchema(f.type),
          };
        });

        components[adapter.className] = {
          type: 'object',
          properties,
        }
      }
    });
  }

  // 入参
  private getParameters(service: IHttpAdapterService) {
    if (service.type.toLowerCase() === 'get') {
      return {
        parameters: service.parameter.map(p => ({
          name: p.name,
          in: p.isPathVariable ? 'path' : 'query',
          description: '',
          required: p.isRequired,
          schema: this.getSchema(p.type),
        })),
      };
    }

    const properties = {};
    service.parameter.filter(p => !p.isPathVariable).forEach(p => {
      properties[p.name] = {
        ...this.getSchema(p.type),
      }
    });

    const requestBody: any = {};

    if (service.parameter.find(p => p.isPathVariable)) {
      requestBody.parameters = service.parameter.filter(p => p.isPathVariable).map(p => ({
        name: p.name,
        in: p.isPathVariable ? 'path' : 'query',
        description: '',
        required: p.isRequired,
        ...this.getSchema(p.type),
      }));
    }

    requestBody.requestBody = {
      content: {
        [service.contentType]: {
          schema: {
            type: 'object',
            properties,
          }
        }
      }
    }

    return { ...requestBody };
  }

  // 描述参数类型的 schema
  private getSchema(type: JavaMeta.ActualType) {
    const { httpAdapter } = this;
    const { name, classPath, items } = type;

    if (httpAdapter.find(m => m.classPath === classPath)) {
      return {
        '$ref': `#/components/schemas/${name}`,
        // 存在引用时要删除自带的 description
        description: undefined,
      };
    }

    const { jsType } = new TypeTransfer().transform(type);
    let schemaType = jsType.split('<')[0];

    if (schemaType.length === 1 && /^[A-Z]$/.test(schemaType)) {
      schemaType = 'object';
    } else {
      schemaType = schemaType.toLowerCase()
    }

    const schema: any = {
      type: ['any', 'void', 'map'].includes(schemaType) ? 'object' : schemaType,
    };

    if (items) {
      schema.items = this.getSchema(items.at(0));
    }

    return schema;
  }

  // 是否为泛型
  private isGenericType(jsType: string) {
    return jsType.length === 1 && /^[A-Z]$/.test(jsType);
  }

  // // 汇总 class 所有字段（包括父类）
  private getClassFields(adapter: IHttpAdapter): IAdapterField[] {
    const { httpAdapter } = this;
    const fields = adapter.fields;
    const superClass = adapter.superClass;

    if (superClass) {
      const superClassAdapter = httpAdapter.find(adapter => adapter.classPath === superClass.type.classPath);
      if (superClassAdapter) {
        const superClassFields = this.getClassFields(superClassAdapter);
        return [ ...superClassFields, ...fields ];
      }
    }

    return fields;
  }

  // 构建 response
  private buildResponseDefinition(res: {jsType: string; type: JavaMeta.ActualType}) {
    const componentData = this.openApi.components.schemas;

    if (!res?.type || componentData[res.jsType]) {
      return;
    }

    // 解析最外层类型
    const targetAdapter = this.httpAdapter.find(adapter => adapter.classPath === res.type.classPath);
    // 自定义类型, Exp: Result<Page<User>>
    if (targetAdapter) {
      const properties: { [key: string]: any } = {};
      const componentFields = this.getClassFields(targetAdapter);

      // 处理字段
      componentFields.forEach((field) => {
        // 判断字段类型
        const { jsType: fieldJsType } = new TypeTransfer().transform(field.type);
        // 指端属性
        let fieldProperty: any = { type: fieldJsType };
        // 判断是否能从解析结果中找到对应的字段类型
        const customClass = this.httpAdapter.find(adapter => adapter.classPath === field.type.classPath);

        if (customClass) {
          // 能找到说明是自定义类型, Exp：{ field: User }
          fieldProperty = {
            '$ref': `#/components/schemas/${field.type.name}`,
          }
        } else {
          // 找不到说明是基础类型或者泛型
          // 1. 泛型的情况下，需要把字段的类型替换为传入参数中的子类型 Exp: { data: T }
          if (this.isGenericType(field.type.name) && Array.isArray(res.type.items)) {
            const childJsType = new TypeTransfer().transform(res.type.items.at(0));
            fieldProperty = {
              '$ref': `#/components/schemas/${childJsType.jsType}`,
            }
            // 需要继续解析的子类型
            this.buildResponseDefinition({
              jsType: childJsType.jsType,
              type: res.type.items.at(0),
            });
          }

          // 字段为数组嵌套泛型 Exp: { data: List<T> || List<User> }
          if (field.type.name === 'List') {
            const childItem = field.type.items.at(0);
            // 子类类型
            const childJsType = new TypeTransfer().transform(childItem);

            fieldProperty = {
              type: 'array',
              items: {},
            }

            // 子类为泛型
            if (this.isGenericType(childItem.name)) {
              // 把泛型替换为父类型
              const childJsType = new TypeTransfer().transform(res.type.items.at(0));
              fieldProperty.items['$ref'] = `#/components/schemas/${childJsType.jsType}`;
            } else {
              // 尝试判断子类是否为自定义类型
              const childClass = this.httpAdapter.find(adapter => adapter.classPath === childItem.classPath);
              if (childClass) {
                // 子类为自定义类型
                fieldProperty.items['$ref'] = `#/components/schemas/${childJsType.jsType}`;
              } else {
                // 子类为基础类型
                fieldProperty.items.type = childJsType.jsType;
              }
            }
          }
        }

        properties[field.name] = fieldProperty;
      });

      componentData[res.jsType] = {
        title: res.jsType,
        type: 'object',
        properties: {
          ...properties,
        }
      }
    } else {
      // 带解析对象最外层为数组, Exp: List<User>
      if (res.type.name === 'List') {
        const childJsType = new TypeTransfer().transform(res.type.items.at(0));

        // 递归
        this.buildResponseDefinition({
          jsType: childJsType.jsType,
          type: res.type.items.at(0),
        });

        componentData[res.jsType] = {
          title: res.jsType,
          type: 'array',
          items: {
            $ref: `#/components/schemas/${childJsType.jsType}`,
          },
        }
      }
    }
  }

  // 返回值
  private getResponse(res: { jsType: string; type: JavaMeta.ActualType }) {
    // 构建返回值类型
    this.buildResponseDefinition(res);

    return {
      '200': {
        description: '',
        content: {
          'application/json': {
            schema: {
              '$ref': `#/components/schemas/${res.jsType}`,
            }
          }
        }
      }
    }
  }
}
