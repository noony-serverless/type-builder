import { BuilderInstance } from '../types';

export abstract class BaseBuilder<T> implements BuilderInstance<T> {
  protected data: Partial<T> = {};
  protected readonly keys: string[];

  constructor(keys: string[]) {
    this.keys = keys;
  }

  abstract build(): T;

  protected createWithMethod(key: string, value: any): this {
    this.data[key as keyof T] = value;
    return this;
  }

  protected createWithMethodName(key: string): string {
    return `with${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  }

  public createProxy(): this {
    const builder = this;
    const proxy = new Proxy(this, {
      get(target, prop) {
        if (typeof prop === 'string' && prop.startsWith('with')) {
          const key = prop.slice(4).charAt(0).toLowerCase() + prop.slice(5);
          if (builder.keys.includes(key)) {
            return (value: any) => {
              builder.createWithMethod(key, value);
              return proxy;
            };
          }
        }

        return (target as any)[prop];
      }
    }) as this;

    return proxy;
  }
}

export function createBuilderWithProxy<T extends BaseBuilder<any>>(builder: T): T {
  return builder.createProxy();
}
