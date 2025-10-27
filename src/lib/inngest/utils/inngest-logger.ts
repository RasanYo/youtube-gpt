/**
 * Structured logging utility for Inngest functions
 * 
 * Provides consistent, formatted logging for background jobs with automatic
 * function name prefixing and support for structured data.
 * 
 * @example
 * ```ts
 * const logger = createLogger('process-video')
 * logger.info('Starting processing', { videoId: '123' })
 * logger.error('Processing failed', { error: err.message })
 * ```
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogContext {
  [key: string]: unknown
}

export class InngestLogger {
  constructor(private functionName: string) {}

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Log error messages
   */
  error(message: string, context?: LogContext): void {
    this.log('error', message, context)
  }

  /**
   * Log debug messages
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  /**
   * Internal log method that formats and outputs logs
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const prefix = `[${this.functionName}]`
    const logMessage = `${prefix} ${message}`

    if (context && Object.keys(context).length > 0) {
      // Log with context
      if (level === 'error') {
        console.error(logMessage, context)
      } else if (level === 'warn') {
        console.warn(logMessage, context)
      } else {
        console.log(logMessage, context)
      }
    } else {
      // Log without context
      if (level === 'error') {
        console.error(logMessage)
      } else if (level === 'warn') {
        console.warn(logMessage)
      } else {
        console.log(logMessage)
      }
    }
  }
}

/**
 * Create a logger instance for an Inngest function
 * 
 * @param functionName - The name of the Inngest function
 * @returns Logger instance with function name prefixed to all logs
 */
export function createLogger(functionName: string): InngestLogger {
  return new InngestLogger(functionName)
}

