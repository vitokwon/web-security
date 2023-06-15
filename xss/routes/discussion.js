const express = require('express');

const db = require('../data/database');
const xss = require('xss');

const router = express.Router();

router.get('/', function (req, res) {
  res.redirect('/discussion');
});

router.get('/discussion', async function (req, res) {
  const comments = await db.getDb().collection('comments').find().toArray();
  res.render('discussion', { comments: comments });
});

router.post('/discussion/comment', async function (req, res) {
  const comment = {
    // xss 적용
    // 댓글 추가 후 , 몽고DB셸에서 내용 확인
    // HTML에서 쓰는 특수문자 설명이 사용됨 (&lt; '<',  &gt; '>')
    text: xss(req.body.comment),
  };

  await db.getDb().collection('comments').insertOne(comment);

  res.redirect('/discussion');
});

module.exports = router;
