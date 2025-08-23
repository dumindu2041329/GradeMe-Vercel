declare module '../dist/app.cjs' {
  import type { RequestHandler } from 'express';

  export interface CreateAppFn {
    (): RequestHandler;
  }

  export const createApp: CreateAppFn;
  const _default: {
    createApp?: CreateAppFn;
    default?: CreateAppFn;
  } | CreateAppFn;
  export default _default;
}


