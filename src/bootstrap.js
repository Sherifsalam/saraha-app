import express from "express";
import multer from "multer";
import { connectDB } from "./DB/connection.js";
import Authrouter from "./Modules/auth/auth.controller.js";
import usersRouter from "./Modules/Users/users.controller.js";
import cors from "cors";
import { redisClient } from "./utils/redis/redis.client.js";
// import { signup as usersRouter } from "./Modules/Users/users.route.js";
// import { notesRouter } from "./Modules/notes/notes.route.js";

export const bootstrap = async () => {
  await connectDB();

  redisClient
    .connect()
    .then(() => {
      console.log("Redis connected successfully");
    })
    .catch((err) => {
      console.error("Redis connection error:", err);
    });


  const app = express();
  app.use(express.json());
  app.use(cors());

  app.use("/api/v1/auth", Authrouter);
  app.use("/api/v1/users", usersRouter);
  // app.use("/notes", notesRouter);

  app.use("/uploads", express.static("./uploads"));

  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    next();
  });

  app.listen(process.env.PORT, () => {
    console.log("server running on port 5200");
  });
};
