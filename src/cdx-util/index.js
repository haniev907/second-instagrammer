const common = require('./common');
const queue = require('./queue');
const logging = require('./logging');
const { envFlag, envRequire } = require('./env');

class UserError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, UserError);
  }
}

class UserResponse {
  constructor(data, error = null, code = 200) {
    this.data = data;
    this.error = error;
    this.code = code;
  }

  json() {
    return {
      data: this.data,
      error: this.error.message,
      code: this.code,
    };
  }
}

class UserResponseOK extends UserResponse {
  constructor() {
    super(UserResponse);

    this.data = 'OK';
  }
}

module.exports = {
  common,
  envFlag, 
  envRequire,
  queue,
  logging,
  UserResponseOK,
  UserError,
};
