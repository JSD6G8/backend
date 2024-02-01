import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { ObjectId } from "mongodb";
import databaseClient from "./services/database.mjs";
import { checkMissing } from "./utils/requestUtils";

// import value from .env
dotenv.config();
const { SERVER_IP: ip, SERVER_PORT: port } = process.env;

// setup webServer variable and essential middlewares
const webServer = express();
webServer.use(cors());
webServer.use(express.json());

// Server Route : Welcome Test
webServer.get("/", (req, res) => {
  res.send("Welcome to LogLife APIs");
});

// ** (assumed they have a token for access)
// Server Route : GET all activities of individual user
webServer.get("/activities/user/:userId", async (req, res) => {});

// Server Route : GET specific activity information
webServer.get("/activities/:activityId", async (req, res) => {});

// Server Route : POST to create new activity
webServer.post("/activities", async (req, res) => {});

// Server Route : PUT to edit selected activity
webServer.put("/activities/:activityId", async (req, res) => {});

// Server Route : DELETE selected activity
webServer.put("/activities/:activityId", async (req, res) => {});

// Initialize server
const newServer = webServer.listen(port, ip, () => {
  console.log(`CONNECTED TO ${databaseClient.db().databaseName} DATABASE`);
});
console.log(`SERVER IS NOW ONLINE AT ${ip}:${port}`);

// Cleanup server and cut connection to database
const onServerCleanup = () => {
  newServer.close(() => {
    console.log(
      `\n${databaseClient.db().databaseName} DATABASE DISCONNECT SUCCESSFULLY`
    );
    try {
      databaseClient.close();
    } catch (err) {
      console.error(err);
    }
  });
};

// Send signal to Node if there's termination ("SIGTERM") or interruption ("SIGINT") command from terminal
process.on("SIGTERM", onServerCleanup);
process.on("SIGINT", onServerCleanup);
