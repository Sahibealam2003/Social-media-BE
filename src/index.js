require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { router: otpRouter } = require("./Router/OtpRouter");
const { router: authRouter } = require("./Router/AuthRoutes");
const { router: postRouter } = require("./Router/PostRoutes");
const { router: followReqRouter } = require("./Router/FollowReqRouter");
const { router:commentRouter  } = require("./Router/CommentRouter");
app.set('trust proxy',1)
// app.use(express.json())
app.use(express.json({limit : '30mb'}));
app.use(express.urlencoded({limit:'30mb',extended  : true}));

app.use(cors({
  origin : process.env.ORIGIN,
  credentials : true
}));
app.use(cookieParser());
app.use("/api", otpRouter);
app.use("/api", authRouter);
app.use("/api", postRouter);
app.use("/api", followReqRouter);
app.use("/api", commentRouter);

mongoose
  .connect(process.env.MONGO_URL) // ✅ correct key
  .then(() => {
    console.log("DB connected");
    app.listen(process.env.PORT, () => {
      console.log("Server running on " + process.env.PORT);
    });
  })
  .catch((err) => {
    console.log("DB not connected", err.message);
  });
