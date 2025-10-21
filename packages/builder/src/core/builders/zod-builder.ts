import { ZodSchema } from 'zod';
import { BaseBuilder } from './base-builder';

export class ZodBuilder<T> extends BaseBuilder<T> {
  private readonly schema: ZodSchema<T>;

  constructor(keys: string[], schema: ZodSchema<T>) {
    super(keys);
    this.schema = schema;
  }

  build(): T {
    const result = this.data as T;
    return this.schema.parse(result);
  }
}

export class AsyncZodBuilder<T> extends BaseBuilder<T> {
  private readonly schema: ZodSchema<T>;

  constructor(keys: string[], schema: ZodSchema<T>) {
    super(keys);
    this.schema = schema;
  }

  async buildAsync(): Promise<T> {
    const result = this.data as T;
    return await this.schema.parseAsync(result);
  }
}
