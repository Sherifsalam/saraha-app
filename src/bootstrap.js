import express from "express";
import multer from "multer";
import { connectDB } from "./DB/connection.js";
import Authrouter from "./Modules/auth/auth.controller.js";
import usersRouter from "./Modules/Users/users.controller.js";
import  messageRouter  from "./Modules/Messages/messages.controller.js";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { redisClient } from "./utils/redis/redis.client.js";
import { globalErrorHandler } from "./utils/error/error_handle.js";
import { authMiddleware } from "./middleware/auth.middlewares.js";
import RedisStore from "rate-limit-redis";

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


  const whitelist = [
    "http://127.0.0.1:5501",
    "http://127.0.0.1:5500",
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || whitelist.includes(origin)) {
          return callback(null, origin);
        }
        return callback(new Error("invalid origin"));
      },
    })
  );

  app.use(
    helmet({
      hidePoweredBy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
        },
      },
    })
  );
  app.use(helmet.noSniff());

 
  app.use(
    authMiddleware,
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 5,
      keyGenerator: (req) => {
        const key= req.user ? req.user._id.toString() : ipKeyGenerator(req.ip);
        return key
      },
      store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      }),
    })
  );

  app.use("/api/v1/auth", Authrouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/messages", messageRouter);

  app.use("/uploads", express.static("./uploads"));

  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  });

  app.use(globalErrorHandler);

  app.listen(process.env.PORT, () => {
    console.log("server running on port " + process.env.PORT);
  });
};