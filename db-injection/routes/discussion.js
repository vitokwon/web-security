const express = require('express');

const db = require('../data/database');

const router = express.Router();

router.get('/', function (req, res) {
  res.redirect('/discussion');
});

router.get('/discussion', async function (req, res) {
  let filter = '';

  if (req.query.author) {
    filter = `WHERE author = "${req.query.author}"`; 
  }
  // 첫번째 쿼리문을 종료 후, 두번째 쿼리문 실행하도록 설정
  // 사용자는 "; " 세미콜론을 가장 앞에 넣어서 첫번째 쿼리문을 종료시킴
  // 예시) Vito"; DROP TABLE comments; SELECT * FROM comments WHERE author = "hans
  // 코멘트 등록 시, 쿼리가 작동하여 테이블 드랍 시킴.
  // const query = `SELECT * FROM comments ${filter}`; // 쿼리주입당함
  const query = `SELECT * FROM comments ?`; // 이스케이프 처리


  console.log(query);

  const [comments] = await db.query(query, [req.query.author]); // ? 값 추가 설정

  res.render('discussion', { comments: comments });
});

router.post('/discussion/comment', async function (req, res) {

  await db.query('INSERT INTO comments (author, text) VALUES (?)', [[req.body.name, req.body.comment]])

  res.redirect('/discussion');
});

module.exports = router;
