import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Db, ObjectId } from "mongodb";
import databaseClient from "./services/database.mjs";
// import { checkMissing } from "./utils/requestUtils.js";

// Import value from .env
dotenv.config();
const { SERVER_IP: ip, SERVER_PORT: port } = process.env;

// Setup webServer variable and essential middlewares
const webServer = express();
webServer.use(cors());
webServer.use(express.json());

// Server Route : Welcome Test
webServer.get("/", (req, res) => {
  res.send("Welcome to LogLife APIs");
});

// ** (assumed they have a token for access)
// ** Server Route : GET all activities of individual user
webServer.get("/activities/user/:userId", async (req, res) => {
  const user = req.params.userId;

  const allActivities = await databaseClient
    .db()
    .collection("loglife_activities")
    .find({ userId: new ObjectId(user) })
    .toArray();

  res.json(allActivities);
});

// ** Server Route : GET specific activity information
webServer.get("/activities/:activityId", async (req, res) => {
  const requestedActivity = req.params.activityId;

  // Use try...catch to return 500 error
  try {
    const activity = await databaseClient
      .db()
      .collection("loglife_activities")
      .find({ _id: new ObjectId(requestedActivity) })
      .toArray();

    // Check whether req.params is correct or not, if result is empty array => return 404
    if (activity.length === 0) {
      res.status(404).json({ error: "Activity not found" });
    } else {
      res.json(activity);
    }
  } catch (error) {
    console.error("ERROR FETCHING ACTIVITY:", error);
    res.status(500).json({ error: "Internal Server error" });
  }
});

// !! Server Route : POST to create new activity
webServer.post("/activities", async (req, res) => {
  const userId = new ObjectId(req.body.userId);
  req.body.userId = userId;

  const insert = await databaseClient
    .db()
    .collection("loglife_activities")
    .insertOne(req.body);

  res.json({ data: { activityId: insert.insertedId } });
});

// !! Server Route : PUT to edit selected activity
webServer.put("/activities/:activityId", async (req, res) => {});

// ** Server Route : DELETE selected activity
webServer.delete("/activities/:activityId", async (req, res) => {
  const requestedActivity = req.params.activityId;

  // Use try...catch to return 500 error
  try {
    const activity = await databaseClient
      .db()
      .collection("loglife_activities")
      .deleteOne({ _id: new ObjectId(requestedActivity) });

    // Check whether MongoDB responded deleteCount as 1 then return 200 if not, return 404
    if (activity.deletedCount === 1) {
      res.status(200).json({
        result: `Activity ${requestedActivity} deleted successfully`,
      });
    } else {
      res.status(404).json({ error: "Activity not found" });
    }
  } catch (error) {
    console.error("ERROR FETCHING ACTIVITY:", error);
    res.status(500).json({ error: "Internal Server error" });
  }
});

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
