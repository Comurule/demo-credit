class BaseError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }

  toJSON() {}
}

export class AppError extends BaseError {
  constructor(message: string, statusCode = 400) {
    super(message, statusCode);
  }

  toJSON() {
    return {
      status: 'error',
      message: this.message,
    };
  }
}

export class InternalServerError extends BaseError {
  constructor(message: string, stacktrace?: string, statusCode = 500) {
    super(message, statusCode);

    if (stacktrace) this.stack = stacktrace;
  }

  toJSON(env = '') {
    return {
      status: 'fail',
      message: this.message,
      stack: env == 'production' ? undefined : this.stack,
    };
  }
}

export class ErrorHelper {
  static BadRequestException(msg: string) {
    throw new AppError(msg, 400);
  }

  static UnauthorizedException(msg: string) {
    throw new AppError(msg, 401);
  }

  static ForbiddenException(msg: string) {
    throw new AppError(msg, 403);
  }

  static NotFoundException(msg: string) {
    throw new AppError(msg, 404);
  }

  static ResourceConflictException(msg: string) {
    throw new AppError(msg, 409);
  }

  static UnprocessibleException(msg: string) {
    throw new AppError(msg, 422);
  }

  static TooManyRequestException(msg: string) {
    throw new AppError(msg, 429);
  }

  static InternalServerErrorException(msg: string, stacktrace?: string) {
    throw new InternalServerError(msg, stacktrace);
  }
}
