/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseBuilder } from './base-builder';

export class ClassBuilder<T> extends BaseBuilder<T> {
  private readonly classConstructor: new (...args: any[]) => T;

  constructor(keys: string[], classConstructor: new (...args: any[]) => T) {
    super(keys);
    this.classConstructor = classConstructor;
  }

  build(): T {
    const instance = new this.classConstructor(this.data);
    return instance;
  }
}
