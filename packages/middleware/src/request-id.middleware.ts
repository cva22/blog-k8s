import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4, validate } from 'uuid';
import { REQUEST_ID_TOKEN_HEADER } from './constants';

export const RequestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestIdHeader = req.headers[REQUEST_ID_TOKEN_HEADER];
  const requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader;
  
  if (
    !requestId ||
    !validate(requestId)
  ) {
    req.headers[REQUEST_ID_TOKEN_HEADER] = uuidv4();
  }

  res.set(REQUEST_ID_TOKEN_HEADER, req.headers[REQUEST_ID_TOKEN_HEADER] as string);
  next();
};
