/**
 * logger.js — CostoBot Backend
 * Centralized structured logging with Winston
 * Supports file rotation, JSON format, and environment-based log levels
 */
'use strict';

const winston = require('winston');
const path = require('path');

// Determine log level from environment or default to 'info'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Create logs directory path
const logsDir = path.join(__dirname, '../../logs');

// Define log formats
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}] ${message} ${metaStr}`;
  })
);

// Define transports
const transports = [
  // Always log to console
  new winston.transports.Console({
    format: consoleFormat,
    level: LOG_LEVEL,
  }),
];

// In production, also write to files
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Combined log file (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: jsonFormat,
      level: LOG_LEVEL,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Error log file (errors only)
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      format: jsonFormat,
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: jsonFormat,
  defaultMeta: { service: 'costobot-backend' },
  transports,
});

module.exports = logger;
