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
const port = process.env.PORT || 8080;
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

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
  console.log(req.auth);

  try {
    // CREATE A NEW CHAT
    const newChat = new Chat({
      userId: userId,
      history: [{ role: "user", parts: [{ text }] }],
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
    res.status(200).send(userChats[0]?.chats);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching userchats!");
  }
});

app.get("/api/chats/:id", ClerkExpressWithAuth(), async (req, res) => {
  const { userId } = req.auth;

  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId });
    res.status(200).send(chat);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching chat!");
  }
});

app.put("/api/chats/:id", ClerkExpressWithAuth(), async (req, res) => {
  const { userId } = req.auth;
  const { question, answer, img } = req.body;

  const newItems = [
    ...(question
      ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }]
      : []),
    { role: "model", parts: [{ text: answer }] },
  ];

  try {
    const updatedChat = await Chat.updateOne(
      { _id: req.params.id, userId },
      {
        $push: {
          history: {
            $each: newItems,
          },
        },
      }
    );
    res.status(200).send(updatedChat);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding conversation");
  }
});

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).send("Unauthenticated");
});
app.listen(port, () => {
  connect();
  console.log(`App running on port ${port}`);
});
