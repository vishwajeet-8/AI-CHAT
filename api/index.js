import express from "express";
import dotenv from "dotenv";
import ImageKit from "imagekit";
import mongoose from "mongoose";
import cors from "cors";
import Chat from "./model/chat.js";
import UserChats from "./model/userChats.js";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
dotenv.config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("connected to DB");
  } catch (error) {
    console.log(error);
  }
};

const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});
app.get("/api/upload", function (req, res) {
  var result = imagekit.getAuthenticationParameters();
  res.send(result);
});

app.post("/api/chats", ClerkExpressWithAuth(), async (req, res) => {
  const { text } = req.body;
  const { userId } = req.auth;

  try {
    // CREATE A NEW CHAT
    const newChat = new Chat({
      userId: userId,
      history: [{ role: "model", parts: [{ text }] }],
    });

    const savedChat = await newChat.save();

    // CHECK IF THE USERCHATS EXISTS
    const userChats = await UserChats.find({ userId: userId });

    // IF DOESN'T EXIST CREATE A NEW ONE AND ADD THE CHAT IN THE CHATS ARRAY
    if (!userChats.length) {
      const newUserChats = new UserChats({
        userId: userId,
        chats: [
          {
            _id: savedChat._id,
            title: text.substring(0, 40),
          },
        ],
      });

      await newUserChats.save();
    } else {
      // IF EXISTS, PUSH THE CHAT TO THE EXISTING ARRAY
      await UserChats.updateOne(
        { userId: userId },
        {
          $push: {
            chats: {
              _id: savedChat._id,
              title: text.substring(0, 40),
            },
          },
        }
      );

      res.status(201).send(newChat._id);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating chat!");
  }
});

app.get("/api/userchats", ClerkExpressWithAuth(), async (req, res) => {
  const { userId } = req.auth;

  try {
    const userChats = await UserChats.find({ userId });
    console.log(userChats);
    res.status(200).send(userChats);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating chat!");
  }
});
app.listen(8080, () => {
  connect();
  console.log("App running on port 8080");
});
