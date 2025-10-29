import type { Request } from 'express';
import { RequestContext } from '@blog/shared-types';
import { REQUEST_ID_TOKEN_HEADER } from './constants';

export function createRequestContext(request: Request): RequestContext {
  const ctx: RequestContext = new RequestContext();

  ctx.url = request.url;
  ctx.requestID = request.headers[REQUEST_ID_TOKEN_HEADER] as string;
  ctx.ip = request.ip ?? '';

  return ctx;
}
