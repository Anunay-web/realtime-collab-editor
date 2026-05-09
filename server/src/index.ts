import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './socket/socket';
import cors from 'cors';
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
const app = express();
app.use(cors());


dotenv.config();
connectDB();

// express.json() will come always before the routes, otherwise req.body will be undefined in the controllers
app.use(express.json());
app.use("/api/auth", authRoutes);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  }
});


app.get("/", (req, res) => {
  res.send("Backend is running...");
});
setupSocket(io);

server.listen(5000, () => {  console.log('Server is running on port 5000');
});