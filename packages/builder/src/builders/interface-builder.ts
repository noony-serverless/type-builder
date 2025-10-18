import { BaseBuilder } from './base-builder';

export class InterfaceBuilder<T> extends BaseBuilder<T> {
  build(): T {
    const result = {} as T;
    
    for (const key of this.keys) {
      const value = this.data[key as keyof T];
      if (value !== undefined) {
        (result as any)[key] = value;
      }
    }
    
    return result;
  }
}
