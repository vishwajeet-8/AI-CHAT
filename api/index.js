import express from "express";
import dotenv from "dotenv";
import ImageKit from "imagekit";
import mongoose from "mongoose";
// import cors from "cors";
dotenv.config();
const app = express();
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("connected to DB");
  } catch (error) {
    console.log(error);
  }
};
app.get("/", (req, res) => {
  res.send("Hello");
});

const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});
app.get("/auth", function (req, res) {
  var result = imagekit.getAuthenticationParameters();
  res.send(result);
});
app.listen(8080, () => {
  connect();
  console.log("App running on port 8080");
});
