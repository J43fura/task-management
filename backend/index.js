import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { auth, JWT_SECRET } from "./middleware/auth.js";

const app = express();
const httpServer = createServer(app);
app.use(cors());
app.use(express.json());
app.use("/tasks", auth);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

await mongoose.connect("mongodb://localhost:27017/task_manager");

const Task = new mongoose.Schema(
  {
    content: String,
    creator: String,
    assigned_to: { type: String, default: null },
    is_finished: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const TasksModel = mongoose.model("Tasks", Task);

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model("User", UserSchema);

// Login / Register
app.post("/auth", async (req, res) => {
  try {
    const { username, password } = req.body;
    let user = await User.findOne({ username });
    if (!user) {
      // User doesn't exist, create new account
      user = new User({ username, password });
      await user.save();
    } else {
      // User exists, verify password
      const isMatch = await bcrypt.compare(password, user.password);
      console.log("isMatch", isMatch); // Failing despite correct password
      if (!isMatch) {
        throw new Error("Invalid password");
      }
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.send({ user, token });
  } catch (error) {
    console.error("Error during authentication:", error);
    res.status(400).send({ error: error.message });
  }
});

app.get("/tasks", async (req, res) => {
  const tasks = await TasksModel.find();
  res.send(tasks);
});

// Require auth
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

let connected_users = 0;
io.on("connection", (socket) => {
  console.log("a user connected", connected_users);

  io.emit("connected-users", ++connected_users);

  socket.on("disconnect", () => {
    console.log("user disconnected", connected_users);
    io.emit("connected-users", --connected_users);
  });

  // emitted from frontend
  socket.on("new-task", async (task) => {
    const taskInstance = new TasksModel(task);
    const taskRes = await taskInstance.save();

    console.log("new-task", taskRes);
    // socket.emit("new-task", task); // Back to the user
    // socket.broadcast.emit("new-task", task); // Back to all users but the user
    io.emit("new-task", taskRes); // Back to all users
  });

  socket.on("remove-task", async (task) => {
    const taskInstance = await TasksModel.findById(task._id);
    const taskRes = await taskInstance.deleteOne();
    console.log("remove-task", task, taskRes);

    io.emit("remove-task", task);
  });

  socket.on("update-task", async (task) => {
    const taskRes = await TasksModel.findByIdAndUpdate(task._id, task, {
      new: true,
    });

    console.log("update-task", taskRes);
    io.emit("update-task", taskRes);
  });
});

httpServer.listen(3000, () => {
  console.log("listening on port localhost:3000");
});
