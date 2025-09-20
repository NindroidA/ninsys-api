/**
 * @fileoverview Logging Utility
 * @description Simple but structured logging for API operations with debug logging.
 */

/**
 * Structured logging utility for the API.
 * Provides consistent log formatting with timestamps and log levels.
 * 
 * @namespace logger
 */
export const logger = {
  /**
   * Log default messages.
   * 
   * @param {string} message Log message
   * @param {...any} args Additional args to log
   */
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },

  /**
   * Log error messages.
   * 
   * @param {string} message Error message
   * @param {...any} args Additional args to log
   */
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },

  /**
   * Log warning messages.
   * 
   * @param {string} message Warning message
   * @param {...any} args Additional args to log
   */
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },

  /**
   * Log debug messages (only in development environment).
   * 
   * @param {string} message Debug message
   * @param {...any} args Additional args to log
   */
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'dev') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
};