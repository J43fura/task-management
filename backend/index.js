import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
app.use(cors());

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

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/tasks", async (req, res) => {
  const tasks = await TasksModel.find();
  res.send(tasks);
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
    console.log("to-remove-task", task);

    const taskInstance = await TasksModel.findById(task._id);
    const taskRes = await taskInstance.deleteOne();

    console.log("remove-task", taskRes);
    io.emit("remove-task", taskRes);
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
  console.log("Example app listening on port localhost:3000");
});
