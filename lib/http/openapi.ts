/**
 * 适配 OpenAPI3.0 协议
 */
import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';

import TypeTransfer from './type-transfer';
import { IHttpAdapter, IHttpAdapterService } from './adapter';

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
            tags: [service.operationId],
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
    });
  }

  // 入参
  private getParameters(service: IHttpAdapterService) {
    if (service.type.toLowerCase() === 'get') {
      return {
        parameters: service.parameter.map(p => ({
          in: p.isPathVariable ? 'path' : 'query',
          name: p.name,
          schema: this.getSchema(p.type),
          description: '',
          required: p.isRequired,
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

  // 返回值
  private getResponse(res: { jsType: string; type: JavaMeta.ActualType }) {
    return {
      '200': {
        description: '',
        content: {
          'application/json': {
            schema: {
              ...this.getSchema(res.type),
            }
          }
        }
      }
    }
  }
}
