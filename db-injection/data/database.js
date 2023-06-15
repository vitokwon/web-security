const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  database: 'security',
  user: 'root',
  password: '111111',

  // SQL주입 방어
  // multipleStatements: true 기본값인 false 로 설정
})

module.exports = pool;