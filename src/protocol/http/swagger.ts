import { TypeTransform } from "../../util/typeTransform";
import { IModelMeta } from "./model";
import { IServiceMeta } from "./service";

export class Swagger {
  openApi = {
    swagger: '2.0',
    info: {
      title: 'title',
      version: '1.0.0',
    },
    paths: {},
    definitions: {},
  };
  // 转换结果
  serviceMeta: IServiceMeta[] = [];
  modelMeta: IModelMeta[] = [];

  constructor(serviceMeta: IServiceMeta[], modelMeta: IModelMeta[]) {
    this.serviceMeta = serviceMeta;
    this.modelMeta = modelMeta;

    this.addPath();
    this.addDefinition();

    console.log('>>>>> this.openApi: ', JSON.stringify(this.openApi));
  }

  addPath() {
    this.serviceMeta.forEach((api: IServiceMeta) => {
      this.openApi.paths[api.url]  = {
        [api.type.toLowerCase()]: {
          description: api.description?.description || '',
          ...this.getParameters(api),
          responses: this.getResponse(api.response)
        },
      }
    });
  }

  addDefinition() {
    this.modelMeta.forEach(model => {
      const properties = {};
      model.fields.forEach(f => {
        properties[f.name] = {
          description: '',
          ...this.getSchema(f.type),
        };
      });

      this.openApi.definitions[model.name] = {
        type: 'object',
        properties,
      }
    });
  }

  // 入参
  getParameters(service: IServiceMeta) {
    if (service.type.toLowerCase() === 'get') {
      return {
        parameters: service.parameter.map(p => ({
          name: p.name,
          in: p.isPathVariable ? 'path' : 'query',
          description: '',
          required: p.isRequired,
          ...this.getSchema(p.type),
        })),
      }
    }

    const parameters = [];
    service.parameter.filter(p => p.isPathVariable).map(p => parameters.push({
      name: p.name,
      in: 'path',
      description: '',
      required: p.isRequired,
      schema: this.getSchema(p.type),
    }));

    service.parameter.filter(p => p.isPathVariable).map(p => parameters.push({
      name: p.name,
      in: 'body',
      description: '',
      required: p.isRequired,
      schema: this.getSchema(p.type),
    }));

    return { parameters };
  }

  // 描述参数类型的 schema
  getSchema(type: JavaMeta.ActualType) {
    const { name, classPath, items } = type;

    if (this.modelMeta.find(m => m.classPath === classPath)) {
      return {
        '$ref': `#/definitions/${name}`,
        // 存在引用时要删除自带的 description
        description: undefined,
      };
    }

    const { jsType } = new TypeTransform().transform(type);
    let schemaType = jsType.split('<')[0];

    if (schemaType.length === 1 && /^[A-Z]$/.test(schemaType)) {
      schemaType = 'object';
    } else {
      schemaType = schemaType.toLowerCase()
    }

    const schema: any = {
      type: ['void', 'map'].includes(schemaType) ? 'object' : schemaType,
    };

    if (items) {
      schema.items = this.getSchema(items.at(0));
    }

    return schema;
  }

  // 返回值
  getResponse(res: { jsType: string; type: JavaMeta.ActualType }) {
    return {
      '200': {
        description: '',
          schema: {
            ...this.getSchema(res.type),
          }
      }
    }
  }
}
