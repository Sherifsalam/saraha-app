import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL, 
  RESP: 2,
   legacyMode: true 
});

redisClient.on("error", (err) => {
  console.log("Redis connection error:", err);
});


