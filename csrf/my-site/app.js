const path = require('path');

const express = require('express');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session');
const csrf = require('csurf');

const db = require('./data/database');
const demoRoutes = require('./routes/demo');

const MongoDBStore = mongodbStore(session);

const app = express();

const sessionStore = new MongoDBStore({
  uri: 'mongodb://localhost:27017',
  databaseName: 'auth-demo',
  collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

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

// csrf 설정 (세션을 사용하기때문에 세션 다음에 설정)
app.use(csrf()) // 활성화 후, 라우터에서 적용.


app.use(async function(req, res, next) {
  const user = req.session.user;
  const isAuth = req.session.isAuthenticated;

  if (!user || !isAuth) {
    return next();
  }

  const userDoc = await db.getDb().collection('users').findOne({_id: user.id});
  const isAdmin = userDoc.isAdmin;

  res.locals.isAuth = isAuth;
  res.locals.isAdmin = isAdmin;
  res.locals.user = user;

  next();
});

app.use(demoRoutes);

app.use(function(error, req, res, next) {
  console.log(error);
  res.render('500');
})

db.connectToDatabase().then(function () {
  app.listen(3000);
});
