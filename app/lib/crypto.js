'use strict';
const bcrypt = require('bcryptjs');

class Crypto {
  static async encryptPassword(plain) {
    return bcrypt.hash(plain, 10);
  }
  
  static async verifyPassword(plain, cipher) {
    return bcrypt.compare(plain, cipher);
  }
}

module.exports = Crypto;