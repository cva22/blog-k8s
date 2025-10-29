import { Injectable, Scope } from '@nestjs/common';
import { inspect } from 'util';
import {
  createLogger as wCreateLogger,
  format as wFormat,
  Logform as WinstonLogform,
  Logger as WinstonLogger,
  transports as wTransports,
} from 'winston';

import { RequestContext } from '@blog/shared-types';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
  private context?: string;
  private readonly logger: WinstonLogger;

  public setContext(context: string): void {
    this.context = context;
  }

  private getMethodName(): string | undefined {
    const stack = new Error().stack;
    if (!stack) return undefined;

    const stackLines = stack.split('\n');

    for (let i = 1; i < stackLines.length; i++) {
      const line = stackLines[i];

      if (line.includes('logger.service.ts') || line.includes('AppLogger')) {
        continue;
      }

      const methodMatch = line.match(
        /at\s+(?:new\s+)?(?:.*\.)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/
      );
      const methodName = methodMatch?.[1];
      if (
        methodName &&
        !['Object', 'Function', 'anonymous', 'eval'].includes(methodName)
      ) {
        return methodName;
      }
    }

    return undefined;
  }

  constructor() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Common payload processing function for all environments
    const processPayload = (
      info: WinstonLogform.TransformableInfo
    ): Record<string, unknown> => {
      const level = String(info.level);
      const message = info.message as unknown as string;
      const timestamp = info.timestamp as unknown as string | undefined;
      const rest: Record<string, unknown> = { ...info } as Record<
        string,
        unknown
      >;

      // Remove Winston's internal fields and duplicates
      const cleanRest: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (
          !key.startsWith('Symbol(') &&
          key !== 'level' &&
          key !== 'message' &&
          key !== 'timestamp'
        ) {
          cleanRest[key] = value;
        }
      }

      const ts = (timestamp as string) ?? new Date().toISOString();

      // Flatten ctx object if it exists
      const flattenedRest: Record<string, unknown> = { ...cleanRest };
      if (
        flattenedRest.ctx &&
        typeof flattenedRest.ctx === 'object' &&
        flattenedRest.ctx !== null
      ) {
        const ctx = flattenedRest.ctx as Record<string, unknown>;
        // Extract ctx properties and add them to the main object
        if (ctx.requestID) flattenedRest.requestID = ctx.requestID;
        if (ctx.url) flattenedRest.url = ctx.url;
        if (ctx.ip) flattenedRest.ip = ctx.ip;
        // Remove the nested ctx object
        delete flattenedRest.ctx;
      }

      // Build clean payload with proper field ordering
      const payload: Record<string, unknown> = {
        requestID: flattenedRest.requestID,
        timestamp: ts,
        level,
        message,
        contextName: flattenedRest.contextName,
        methodName: flattenedRest.methodName,
        url: flattenedRest.url,
        ip: flattenedRest.ip,
        ...flattenedRest,
      };

      // Remove any undefined values and duplicates
      const cleanPayload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && !key.startsWith('Symbol(')) {
          cleanPayload[key] = value;
        }
      }

      return cleanPayload;
    };

    const devFormat: WinstonLogform.Format = wFormat.combine(
      wFormat.timestamp(),
      wFormat.printf((info: WinstonLogform.TransformableInfo) => {
        const payload = processPayload(info);
        return inspect(payload, { colors: true, depth: null, compact: false });
      })
    );

    const prodFormat: WinstonLogform.Format = wFormat.combine(
      wFormat.timestamp(),
      wFormat.printf((info: WinstonLogform.TransformableInfo) => {
        const payload = processPayload(info);
        return JSON.stringify(payload);
      })
    );

    this.logger = wCreateLogger({
      format: isDevelopment ? devFormat : prodFormat,
      transports: [new wTransports.Console()],
    });
  }

  // Centralized logging call with explicit dispatch to avoid unsafe indexing
  private logWith(
    level: 'error' | 'warn' | 'debug' | 'verbose' | 'info',
    payload: Record<string, unknown>
  ): WinstonLogger {
    switch (level) {
      case 'error':
        return this.logger.error(payload as unknown as never);
      case 'warn':
        return this.logger.warn(payload as unknown as never);
      case 'debug':
        return this.logger.debug(payload as unknown as never);
      case 'verbose':
        return this.logger.verbose(payload as unknown as never);
      case 'info':
      default:
        return this.logger.info(payload as unknown as never);
    }
  }

  error(
    ctx: RequestContext,
    message: string,
    meta?: Record<string, unknown>
  ): WinstonLogger {
    const timestamp = new Date().toISOString();
    const methodName = this.getMethodName();

    return this.logWith('error', {
      message,
      contextName: this.context,
      methodName,
      ctx,
      timestamp,
      ...meta,
    });
  }

  warn(
    ctx: RequestContext,
    message: string,
    meta?: Record<string, unknown>
  ): WinstonLogger {
    const timestamp = new Date().toISOString();
    const methodName = this.getMethodName();

    return this.logWith('warn', {
      message,
      contextName: this.context,
      methodName,
      ctx,
      timestamp,
      ...meta,
    });
  }

  debug(
    ctx: RequestContext,
    message: string,
    meta?: Record<string, unknown>
  ): WinstonLogger {
    const timestamp = new Date().toISOString();
    const methodName = this.getMethodName();

    return this.logWith('debug', {
      message,
      contextName: this.context,
      methodName,
      ctx,
      timestamp,
      ...meta,
    });
  }

  verbose(
    ctx: RequestContext,
    message: string,
    meta?: Record<string, unknown>
  ): WinstonLogger {
    const timestamp = new Date().toISOString();
    const methodName = this.getMethodName();

    return this.logWith('verbose', {
      message,
      contextName: this.context,
      methodName,
      ctx,
      timestamp,
      ...meta,
    });
  }

  log(
    ctx: RequestContext,
    message: string,
    meta?: Record<string, unknown>
  ): WinstonLogger {
    const timestamp = new Date().toISOString();
    const methodName = this.getMethodName();

    return this.logWith('info', {
      message,
      contextName: this.context,
      methodName,
      ctx,
      timestamp,
      ...meta,
    });
  }

  // Convenience method for service-to-service calls without RequestContext
  logServiceCall(
    serviceName: string,
    message: string,
    meta?: Record<string, unknown>
  ): WinstonLogger {
    const timestamp = new Date().toISOString();
    const methodName = this.getMethodName();

    return this.logWith('info', {
      message,
      contextName: this.context,
      methodName,
      serviceName,
      timestamp,
      ...meta,
    });
  }

  // Convenience method for errors without RequestContext
  logServiceError(
    serviceName: string,
    message: string,
    meta?: Record<string, unknown>
  ): WinstonLogger {
    const timestamp = new Date().toISOString();
    const methodName = this.getMethodName();

    return this.logWith('error', {
      message,
      contextName: this.context,
      methodName,
      serviceName,
      timestamp,
      ...meta,
    });
  }
}
