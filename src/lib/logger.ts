type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

// LogTags for VidoraFrameForge operations
export const LogTags = {
  // Auth operations
  LOGIN: 'LOGIN',
  SIGNUP: 'SIGNUP',
  LOGOUT: 'LOGOUT',
  AUTH: 'AUTH',
  AUTH_MIDDLEWARE: 'AUTH_MIDDLEWARE',

  // Video operations
  VIDEO_UPLOAD: 'VIDEO_UPLOAD',
  VIDEO_FETCH: 'VIDEO_FETCH',
  VIDEO_DELETE: 'VIDEO_DELETE',
  VIDEO_UPDATE: 'VIDEO_UPDATE',
  VIDEO_PROCESS: 'VIDEO_PROCESS',

  // User operations
  USER_PROFILE: 'USER_PROFILE',
  USER_UPDATE: 'USER_UPDATE',

  // Journal operations
  JOURNAL_FETCH: 'JOURNAL_FETCH',
  JOURNAL_CREATE: 'JOURNAL_CREATE',
  JOURNAL_UPDATE: 'JOURNAL_UPDATE',
  JOURNAL_DELETE: 'JOURNAL_DELETE',

  // Photo operations
  PHOTO_FETCH: 'PHOTO_FETCH',
  PHOTO_UPLOAD: 'PHOTO_UPLOAD',
  PHOTO_UPDATE: 'PHOTO_UPDATE',
  PHOTO_DELETE: 'PHOTO_DELETE',

  // API operations
  API_REQUEST: 'API_REQUEST',
  API_RESPONSE: 'API_RESPONSE',
  API_ERROR: 'API_ERROR',

  // Database operations
  DB_CONNECT: 'DB_CONNECT',
  DB_QUERY: 'DB_QUERY',
  DB_ERROR: 'DB_ERROR',

  // ImageKit operations
  IMAGEKIT_UPLOAD: 'IMAGEKIT_UPLOAD',
  IMAGEKIT_AUTH: 'IMAGEKIT_AUTH',

  // General
  GENERAL: 'GENERAL',
} as const;

export type LogTag = typeof LogTags[keyof typeof LogTags];

/**
 * Error types for proper error categorization
 */
export class ClientRequestError extends Error {
  public status: number;
  public statusText: string;
  public response?: unknown;

  constructor(message: string, status: number, statusText: string, response?: unknown) {
    super(message);
    this.name = 'ClientRequestError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

export class ServerResponseError extends Error {
  public status: number;
  public statusText: string;
  public response?: unknown;

  constructor(message: string, status: number, statusText: string, response?: unknown) {
    super(message);
    this.name = 'ServerResponseError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

export class SerializationError extends Error {
  public originalError: Error;

  constructor(message: string, originalError: Error) {
    super(message);
    this.name = 'SerializationError';
    this.originalError = originalError;
  }
}

export class ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Categorize errors similar to exception handling patterns
 */
export function categorizeError(error: unknown): Error {
  // Type guard for Error objects
  const isError = (err: unknown): err is Error => err instanceof Error;

  // Type guard for objects with HTTP status properties
  const hasStatus = (err: unknown): err is { status: number; message?: string; statusText?: string; response?: unknown } => {
    return typeof err === 'object' && err !== null && 'status' in err && typeof (err as { status: unknown }).status === 'number';
  };

  if (isError(error)) {
    // Network/Connection errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new ConnectionError('Check your Internet Connection');
    }

    // Timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return new TimeoutError('Request timed out');
    }

    // JSON parsing errors
    if (error.name === 'SyntaxError' || error.message.includes('JSON')) {
      return new SerializationError(`Error in parsing response: ${error.message}`, error);
    }

    const message = error.message || '';

    // MongoDB connectivity / server selection failures
    if (
      error.name === 'MongooseServerSelectionError' ||
      error.name === 'MongoNetworkTimeoutError' ||
      message.includes('ECONNREFUSED') ||
      message.includes('Server selection timed out') ||
      message.includes('MongoServerSelectionError')
    ) {
      return new ConnectionError(`Database connection failed: ${message}`);
    }

    // Mongoose/MongoDB errors
    if (error.name === 'ValidationError' || error.message.includes('validation failed')) {
      return new ValidationError(`Validation error: ${error.message}`);
    }

    if (error.name === 'CastError' || error.name === 'MongoError' || error.name === 'MongoServerError' || error.name === 'MongoNetworkError') {
      return new DatabaseError(`Database error: ${error.message}`);
    }

    // Mongoose duplicate key error
    if (error.name === 'MongoServerError' && (error as any).code === 11000) {
      return new DatabaseError(`Duplicate key error: ${error.message}`);
    }

    // Mongoose connection errors
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return new ConnectionError('Database connection timeout');
    }

    // Database errors
    if (error.message.includes('MongoDB') || error.message.includes('database') || error.message.includes('E11000')) {
      return new DatabaseError(`Database error: ${error.message}`);
    }

    // Validation errors
    if (error.message.includes('validation') || error.message.includes('Validation')) {
      return new ValidationError(`Validation error: ${error.message}`);
    }

    // Authentication errors
    if (error.message.includes('Account not fully set up') ||
        error.message.includes('not fully set up') ||
        error.message.includes('ACCOUNT_INCOMPLETE') ||
        error.message.includes('Authentication')) {
      return new AuthenticationError(`Authentication error: ${error.message}`);
    }
  }

  // HTTP status errors
  if (hasStatus(error)) {
    if (error.status >= 400 && error.status < 500) {
      return new ClientRequestError(
        `Client error: ${error.message || 'Client Error'}`,
        error.status,
        error.statusText || 'Unknown',
        error.response
      );
    }
    if (error.status >= 500) {
      return new ServerResponseError(
        'Error from Server Side',
        error.status,
        error.statusText || 'Unknown',
        error.response
      );
    }
  }

  // Generic fallback that preserves useful message details when available
  if (isError(error)) {
    return new Error(error.message || 'Unexpected Error');
  }

  return new Error('Unexpected Error');
}

/**
 * Main Logger class with Kotlin-style methods
 */
export class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, tag: LogTag, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${tag}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(tag: LogTag, message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', tag, message, context));
    }
  }

  warn(tag: LogTag, message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', tag, message, context));
  }

  error(tag: LogTag, message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error
      ? { ...context, error: error.message, stack: error.stack }
      : { ...context, error };

    console.error(this.formatMessage('error', tag, message, errorContext));

    // In production, you might want to send errors to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error monitoring service (Sentry, etc.)
    }
  }

  debug(tag: LogTag, message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', tag, message, context));
    }
  }

  /**
   * Kotlin-style logging methods
   * Similar to Log.d(), Log.e(), Log.i(), Log.w() in Android
   */

  /**
   * Debug logging similar to Kotlin Log.d()
   * Only logs in development mode
   */
  static d(tag: LogTag, message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${tag}] ${message}`, context || '');
    }
  }

  /**
   * Error logging similar to Kotlin Log.e()
   */
  static e(tag: LogTag, message: string, context?: LogContext) {
    console.error(`[${tag}] ${message}`, context || '');
  }

  /**
   * Info logging similar to Kotlin Log.i()
   */
  static i(tag: LogTag, message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[${tag}] ${message}`, context || '');
    }
  }

  /**
   * Warning logging similar to Kotlin Log.w()
   */
  static w(tag: LogTag, message: string, context?: LogContext) {
    console.warn(`[${tag}] ${message}`, context || '');
  }

  /**
   * Get stack trace string similar to Kotlin Log.getStackTraceString()
   */
  static getStackTraceString(error: Error): string {
    return error.stack || 'No stack trace available';
  }

  /**
   * Mask sensitive data for safe logging
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return `${local.slice(0, 2)}***@${domain}`;
  }

  maskToken(token: string | undefined | null): string {
    if (!token || typeof token !== 'string') return '';
    if (token.length <= 12) return token;
    return `${token.slice(0, 6)}...${token.slice(-6)}`;
  }

  /**
   * Static mask helpers
   */
  static maskEmail(email: string): string {
    return new Logger().maskEmail(email);
  }

  static maskToken(token: string | undefined | null): string {
    return new Logger().maskToken(token);
  }

  // Auth-specific logging methods
  auth = {
    loginAttempt: (email: string) => this.info(LogTags.LOGIN, 'Login attempt', { email: this.maskEmail(email) }),
    loginSuccess: (userId: string) => this.info(LogTags.LOGIN, 'Login successful', { userId }),
    loginFailed: (email: string, reason: string) => this.warn(LogTags.LOGIN, 'Login failed', { email: this.maskEmail(email), reason }),
    registerAttempt: (email: string) => this.info(LogTags.SIGNUP, 'Registration attempt', { email: this.maskEmail(email) }),
    registerSuccess: (userId: string) => this.info(LogTags.SIGNUP, 'Registration successful', { userId }),
    registerFailed: (email: string, reason: string) => this.warn(LogTags.SIGNUP, 'Registration failed', { email: this.maskEmail(email), reason }),
  };

  // Video-specific logging methods
  video = {
    uploadStart: (userId: string, fileName: string) => this.info(LogTags.VIDEO_UPLOAD, 'Video upload started', { userId, fileName }),
    uploadSuccess: (userId: string, videoId: string) => this.info(LogTags.VIDEO_UPLOAD, 'Video upload successful', { userId, videoId }),
    uploadFailed: (userId: string, reason: string) => this.error(LogTags.VIDEO_UPLOAD, 'Video upload failed', new Error(reason), { userId }),
    videoFetched: (videoId: string) => this.debug(LogTags.VIDEO_FETCH, 'Video fetched', { videoId }),
    videoDeleted: (userId: string, videoId: string) => this.info(LogTags.VIDEO_DELETE, 'Video deleted', { userId, videoId }),
  };

  // API-specific logging methods
  api = {
    request: (method: string, url: string, status?: number) =>
      this.debug(LogTags.API_REQUEST, 'API request', { method, url, status }),
    response: (method: string, url: string, status: number, duration?: number) =>
      this.debug(LogTags.API_RESPONSE, 'API response', { method, url, status, duration }),
    error: (method: string, url: string, status: number, error: string) =>
      this.error(LogTags.API_ERROR, 'API error', new Error(error), { method, url, status }),
  };

  // Database-specific logging methods
  db = {
    connect: () => this.info(LogTags.DB_CONNECT, 'Database connected'),
    query: (operation: string, collection: string) => this.debug(LogTags.DB_QUERY, 'Database query', { operation, collection }),
    error: (operation: string, error: string) => this.error(LogTags.DB_ERROR, 'Database error', new Error(error), { operation }),
  };
}

export const logger = new Logger();
export type { LogLevel, LogContext };