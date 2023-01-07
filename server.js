const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
const MongoClient = require("mongodb").MongoClient;
app.set("view engine", "ejs");
app.use("/public", express.static("public"));
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

var db;

MongoClient.connect("mongodb+srv://rlool:Eun2Eun2@simple-board-cluster.vtup2xr.mongodb.net/?retryWrites=true&w=majority", function (에러, client) {
  if (에러) return console.log(에러);
  db = client.db("todoapp");

  app.listen(8080, function () {
    console.log("listening on 8080");
  });
});

app.get("/", function (요청, 응답) {
  응답.render("index.ejs");
});

app.get("/write", function (요청, 응답) {
  응답.render("write.ejs");
});

app.get("/list", function (요청, 응답) {
  db.collection("post")
    .find()
    .toArray(function (에러, 결과) {
      console.log(결과);
      응답.render("list.ejs", { posts: 결과 });
    });
});

app.get("/search", (요청, 응답) => {
  var 검색조건 = [
    {
      $search: {
        index: "titleSearch",
        text: {
          query: 요청.query.value,
          path: "title",
        },
      },
    },
  ];
  db.collection("post")
    .aggregate(검색조건)
    .toArray((에러, 결과) => {
      console.log(결과);
      응답.render("search.ejs", { posts: 결과 });
    });
});

app.get("/detail/:id", function (요청, 응답) {
  요청.params.id = parseInt(요청.params.id);
  db.collection("post").findOne({ _id: 요청.params.id }, function (에러, 결과) {
    console.log(결과);
    응답.render("detail.ejs", { data: 결과 });
  });
});

app.get("/edit/:id", function (요청, 응답) {
  요청.params.id = parseInt(요청.params.id);
  db.collection("post").findOne({ _id: 요청.params.id }, function (에러, 결과) {
    응답.render("edit.ejs", { post: 결과 });
  });
});

app.put("/edit", function (요청, 응답) {
  db.collection("post").updateOne(
    { _id: parseInt(요청.body.id) },
    { $set: { title: 요청.body.title, artist: 요청.body.artist } },
    function (에러, 결과) {
      console.log("수정완료");
      응답.redirect("/list");
    }
  );
});

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const e = require("express");

app.use(session({ secret: "비밀코드", resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", function (요청, 응답) {
  응답.render("login.ejs");
});

app.post("/login", passport.authenticate("local", { failureRedirect: "/fail" }), function (요청, 응답) {
  응답.redirect("/");
});

app.get("/mypage", 로그인했니, function (요청, 응답) {
  console.log(요청.user);
  응답.render("mypage.ejs", { 사용자: 요청.user });
});

function 로그인했니(요청, 응답, next) {
  if (요청.user) {
    next();
  } else {
    응답.send("로그인안했네요");
  }
}

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (입력한아이디, 입력한비번, done) {
      //console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne({ id: 입력한아이디 }, function (에러, 결과) {
        if (에러) return done(에러);
        if (!결과) return done(null, false, { message: "존재하지않는 아이디요" });
        if (입력한비번 == 결과.pw) {
          return done(null, 결과);
        } else {
          return done(null, false, { message: "비번틀렸어요" });
        }
      });
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (아이디, done) {
  db.collection("login").findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과);
  });
});

app.post("/add", function (요청, 응답) {
  응답.send("전송완료");
  db.collection("counter").findOne({ name: "postCount" }, function (에러, 결과) {
    console.log(결과.totalPost);
    var 총게시물갯수 = 결과.totalPost;
    db.collection("post").insertOne(
      {
        _id: 총게시물갯수 + 1,
        title: 요청.body.title,
        artist: 요청.body.artist,
        작성자: 요청.user._id,
      },
      function (에러, 결과) {
        console.log("저장완료");
        db.collection("counter").updateOne({ name: "postCount" }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
          if (에러) {
            return console.log(에러);
          }
        });
      }
    );
  });
});

app.delete("/delete", function (요청, 응답) {
  console.log(요청.body);
  요청.body._id = parseInt(요청.body._id);

  var 삭제할데이터 = { _id: 요청.body._id, 작성자: 요청.user._id };

  db.collection("post").deleteOne(삭제할데이터, function (에러, 결과) {
    console.log("삭제완료");
    if (결과) {
      console.log(결과);
    }
    응답.status(200).send({ message: "success" });
  });
});

app.get("/member", function (요청, 응답) {
  응답.render("member.ejs");
});

app.post("/member", function (요청, 응답) {
  var 가입요청아이디 = 요청.body.email;
  if (가입요청아이디.length <= 10 && 가입요청아이디.length >= 4) {
    db.collection("login").findOne({ id: 가입요청아이디 }, function (에러, 결과) {
      if (결과 == null) {
        db.collection("login").insertOne({ id: 가입요청아이디, pw: 요청.body.pw }, function (에러, 결과) {
          console.log("가입완료");
          응답.redirect("/login");
        });
      } else if (결과) {
        console.log("이미 가입된 아이디 입니다.");
        응답.redirect("/member");
      }
    });
  } else {
    console.log("아이디를 4자이상 10자 이하로 넣어주세요.");
    응답.redirect("/member");
  }
});
