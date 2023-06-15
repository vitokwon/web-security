# 보안
    -   웹사이트 보안과 인증의 차이
    -   CSRF, XSS, SQL 주입 등의 공격
    -   사용자 입력에 대한 회피와 삭제 (타사 패키지 사용)
 
## 1) 인증과 보안에 대한 이해

    -   인증 (의도된 작업풀)
        -   로그인, 가입, 로그아웃 시 계정이 없는 익명 사용자와의 구분을 위해 사용
        -   계정 권한에 따른 행동 제한

    -   웹사이트 보안
        -   허용되어선 안되는 악의적 행위
        -   데이터 변형, 삭제, 노출

## 2) CSRF 공격
    -   Cross Site Request Forgery (사이트 간 요청 위조)
    -   수행해서는 안되는 작업을 유발하는 요청을 서버로 보냄
    -   의도하지 않은 세션 추가 후 웹사이트 위조하여 방문자의 세션을 사용하여 실제 서버에 요청

## 3) CSRF 데모 셋팅
    -   cd csrf / cd my-site / npm install && npm start
    -   회원가입 후 로그인하면 더미 송금 페이지
        -   이메일과 금액을 입력하는 송금시스템 가정
    -   test 유저에게 500 송금 후 db 확인

## 4) CSRF 공격 데모
    -   공격자는 동일 웹사이트 구축 후 기존 가입자들 유인
    -   공격자는 돈을 받는 주소 또는 금액 변경
    -   CSRF 공격은 모든 웹사이트에서 가능함
    -   `acctacker-site` 구축.
        -   재구축 사이트에서 동일한 템플릿에 히든태그 사용하여 공격
        -   정상 폼 제출(URL) 함으로써 의도 달성

## 5) CSRF 공격 방어
    -   악성 사이트 요청에도 쿠키가 첨부 됨
    -   최신 브라우저에는 `samesite cookies` 기능 탑재 됨 (MDN web Docs에서 확인 가능)
    -   크롬은 `Lax`를 기본 구성으로 사용.
    -   로컬호스트에선 전부 비활성화
    -   일부 브라우저 환경에 따라 지원이 안될 수 있음.
```JavaScript
app.use(session({
  secret: 'super-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 2 * 24 * 60 * 60 * 1000,
    sameSite: 'lax' // 지원되는 모든 브라우저에 관해 `lax`를 활성화, 익스플로러는 지원 안됨.
    //다른 종류의 CSRF 공격도 있음. 아주 작은 사용자
  }
}));

```

## 6) 더 나은 CSRF 공격 방어
    -   `Views`에서 CSRF Token 생성 됨
        -   서버에서 생성되는 무작위 문자열값
        -   서버에서만 확인가능, 수명 주기 짧음
        -   서버에서 랜더링하는 템플릿에 주입 후 수신되는 요청에 관해 유효한 토큰이 포함됐는지 검증
    -   `csurf` 타사 패키지 사용
        -   npm install csurf 설치
        -   app.js에서 패키지 활성화
    -   모든 양식에는 CSRF 토큰이 포함되어 보호되어야 함.
```JavaScript
// csrf 설정 (세션을 사용하기때문에 세션 다음에 설정)
app.use(csrf()) // 활성화 후, 라우터에서 적용.
```
        -   라우트에서 토큰 생성

```JavaScript
router.get("/transaction", function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }
  // csrf 설정 후 ejs에 숨겨진 양식 추가
  const csrfToken = req.csrfToken();
  res.render("transaction", { csrfToken: csrfToken });
});
```
        -   `hidden` 인풋 추가
```JavaScript
    <form action="/transaction" method="POST">
      <!-- csrf 히든 토큰 추가, 네임은 `_csrf`로 지정 -->
      <input type="hidden" value="<%= csrfToken %>" name="_csrf">
```

## 7) XSS 공격
    -   Cross Site Scripting
    -   악성 자바스크립트 코드를 웹사이트 콘텐츠에 주입
    -   코멘트란에 스크립트를 적어서 등록했을 떄 실행이 됨.
```html
<!-- 코멘트 기입란에 아래와 같이 작성 후 제출 -->
<script>
alert('Hacked!');
// 또는 ajax 요청 시, 심각한 공격이 가능함.
</script>
```
    -   유저가 생성하는 콘텐츠(댓글,게시물 등)를 출력하는 페이지마다 공격당할 수 있음.

## 8) XSS 공격 방어
    -   두가지 주요 블록
        1.   이스케이프된 사용자 컨텐츠를 출력
            -   원시 HTML 코드를 그대로 사용해서 구문분석하거나 브라우저에 전달하여 구문 분석하는 대신, 이스케이프 처리를 해야 함. 
            -   이스케이프 처리란, HTML 대신 원시 텍스트로 처리 됨을 의미.
        2.   사용자 입력을 처리하거나 저장하기 전에 정리
            -   이스케이프를 했다면 굳이 추가 필요하진 않음.
    -   이스케이프 처리
        -   데이터베이스 출력 시, ejs에서 등호를 사용해야 함.
```html
<!-- 등호가 사용되면 이스케이프 처리되어 출력 -->
 <%= comment.text %>
 <!-- 대쉬가 사용되면 이스케이프 처리 안됨 -->
 <%- comment.text %>
```

    -   데이터 처리 전에 사용자 입력 삭제
        -   컨텐츠를 살펴보고 미리 위험한 것을 제거
        -   타사 패키지 사용이 용이함.
            -   `express sanitize user input` 구글링
            -   `express-validator` (일반 입력 유효성 검사에도 사용 가능)
            -   `xpress xss` 구글링
                -   npm install xss 설치
                -   라우트에서 import, const xss = require('xss');
                -   악성 컨텐츠를 수신하는 라우트에 적용
```JavaScript
router.post('/discussion/comment', async function (req, res) {
  const comment = {
    // xss 적용
    // 댓글 추가 후 , 몽고DB셸에서 내용 확인
    // HTML에서 쓰는 특수문자 설명이 사용됨 (&lt; '<',  &gt; '>')
    text: xss(req.body.comment),
  };

```

## 9) SQL 주입 공격
    -   mySql 예시
        -   추측이 가능한 테이블명으로 시도
        -   첫번째 쿼리문을 종료 후, 두번째 쿼리문 실행하도록 설정
        -   사용자는 "; " 세미콜론을 가장 앞에 넣어서 첫번째 쿼리문을 종료시킴
        -   예시) Vito"; DROP TABLE comments; SELECT * FROM comments WHERE author = "hans
        -   위와 같이 쿼리를 주입함. 테이블 이름이 맞다면, 코멘트 등록 시, 쿼리가 작동하여 테이블 드랍 시킴.

    -   이스케이프 처리로 방어
        -   일반적으로 내장된 보호기능이 있음.
        -   (?)를 사용하여 자동으로 이스케이프 처리.
```JavaScript
router.post('/discussion/comment', async function (req, res) {

  await db.query('INSERT INTO comments (author, text) VALUES (?)', [[req.body.name, req.body.comment]])

  res.redirect('/discussion');
});
```
    -   다른 보호 방법
``` JavaScript
const pool = mysql.createPool({

  // SQL주입 방어
  // multipleStatements: true 기본값인 false 로 설정되면 1개 이상 쿼리는 작동하지 않음.
})
```

    -   NoSQL
        -   `node nosql injection` 구글링 참고
        -   기본적인 보호 기능이 적용되기때문에 패스.
    
## 10) 요약
    -   사용자의 입력을 신뢰하면 안됨
    -   처리 하기 전, 삭제 또는 이스케이프 적용
    -   타사 라이브러리 활용 (csrf토큰)
        -   모든 양식에 csrf토큰을 추가해야 함.
    -   추가 아이디어
        -   정적 폴더를 사용할 경우, 'public'
            -   개발도구-네트워크에서 파일경로를 확인하여 파일 자체를 요청할 수 있음. ('localhost:3000/base.css')
            -   해당 폴더에는 사용자데이터, 제이슨파일 등 저장하면 안됨
            -   모든 폴더를 정적폴더로 설정하면 안됨. (app.use(express.static(''));)
            -   정적폴더에는 css, img 등만 주로 저장.
        -   원시적인 에러페이지를 출력하면 안됨.
            -   미들웨어를 이용하여 '500.ejs'를 출력하도록 설정.
