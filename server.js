import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import databaseClient from "./services/database.mjs";
import * as activityControllers from "./controllers/activityControllers.js";

const PORT = process.env.SERVER_PORT || 3000;

dotenv.config();

const webServer = express();
webServer.use(cors());
webServer.use(express.json());
webServer.use(helmet());
webServer.use(morgan("dev"));

// server routes
webServer.get("/", async (req, res) => {
  res.send("Welcome to LogLife API");
});

webServer.get("/activities/user/:userId", activityControllers.listActivities);
webServer.get("/activities/:activityId", activityControllers.getActivity);
webServer.post("/activities", activityControllers.createActivity);
webServer.put("/activities/:activityId", activityControllers.updateActivity);
webServer.delete("/activities/:activityId", activityControllers.deleteActivity);

// initialize web server
const currentServer = webServer.listen(PORT, () => {
  console.log(`Database connected: ${databaseClient.db().databaseName}`)
});

// clean up on exit
function cleanup () {
  currentServer.close(() => {
    console.log("Server closed.");
    try {
      databaseClient.close();
      console.log("Database connection closed.");
    } catch (err) {
      console.error(err);
    }
  })
}

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);