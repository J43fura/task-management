import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

let connected_users = 0;
let indexCounter = 0;

io.on("connection", (socket) => {
  console.log("a user connected", connected_users);

  io.emit("connected-users", ++connected_users);

  socket.on("disconnect", () => {
    console.log("user disconnected", connected_users);
    io.emit("connected-users", --connected_users);
  });

  // emitted from frontend

  socket.on("new-task", (task) => {
    task.status = "default";
    task.index = ++indexCounter;
    console.log("new-task", task);

    // emit back to frontend
    // socket.emit("new-task", task); // Back to the user
    // socket.broadcast.emit("new-task", task); // Back to all users but the user
    io.emit("new-task", task); // Back to all users
  });

  socket.on("remove-task", (task) => {
    console.log("remove-task", task);
    io.emit("remove-task", task);
  });

  socket.on("update-task", (task) => {
    console.log("update-task", task);
    const new_status = task.status === "default" ? "started" : "default";
    task.status = new_status;
    io.emit("update-task", task);
  });
});

httpServer.listen(3000, () => {
  console.log("Example app listening on port localhost:3000");
});
