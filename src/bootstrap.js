import express from "express";
import { connectDB } from "./DB/connection.js";
// import { signup as usersRouter } from "./Modules/Users/users.route.js";
// import { notesRouter } from "./Modules/notes/notes.route.js";

export const bootstrap = async () => {
  await connectDB();
  const app = express();
  app.use(express.json());

  // app.use("/users", usersRouter);
  // app.use("/notes", notesRouter);

  app.listen(process.env.PORT, () => {
    console.log("server running on port 5200");
  });
};
