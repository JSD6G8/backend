import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import databaseClient from "./services/database.mjs";
import { ObjectId } from "mongodb";
import { requestSchema } from "./models/utils.js";

const HOSTNAME = process.env.SERVER_IP || "127.0.0.1";
const PORT = process.env.SERVER_PORT || 3000;

dotenv.config();

const webServer = express();
webServer.use(cors());
webServer.use(express.json());

// server routes
webServer.get("/", async (req, res) => {
  res.send("Welcome to LogLife API");
});

// List activities of a user
webServer.get("/activities/user/:userId", async (req, res) => {
  const userId = req.params.userId;

  // validate if userId is a valid ObjectId
  if (!ObjectId.isValid(userId)) {
    return res.status(400).send("Invalid userId");
  }

  const activities = await databaseClient.db()
    .collection("activities")
    .find({ userId: new ObjectId(userId) })
    .toArray();  
  res.send(activities);
});

// Get an activity
webServer.get("/activities/:activityId", async (req, res) => {
  const activityId = req.params.activityId;

  // validate if activityId is a valid ObjectId
  if (!ObjectId.isValid(activityId)) {
    return res.status(400).send("Invalid activityId");
  }

  const activity = await databaseClient.db()
    .collection("activities")
    .findOne({ _id: new ObjectId(activityId) });
  res.send(activity);
});

// Create a new activity
webServer.post("/activities", async (req, res) => {
  // validiate request body
  const { error } = requestSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  // validate if userId is a valid ObjectId
  if (!ObjectId.isValid(req.body.userId)) {
    return res.status(400).send("Invalid userId");
  }

  // insert activity into database
  const userId = new ObjectId(req.body.userId);
  const activity = { ...req.body, userId };
  const returnedActivity = { activityId: "", ...activity };

  const result = await databaseClient.db()
    .collection("activities")
    .insertOne(activity);

  returnedActivity.activityId = result.insertedId;
  
  res.send({ 
    result,
    data: returnedActivity,
  });
});

// Update an activity
webServer.put("/activities/:activityId", async (req, res) => {
  // validiate request body
  const { error } = requestSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  console.log(req.body);

  // update activity in database
  const activityId = req.params.activityId;
  const activity = req.body;
  activity.userId = new ObjectId(activity.userId);

  const result = await databaseClient.db()
    .collection("activities")
    .updateOne({ _id: new ObjectId(activityId) }, { $set: activity });

  res.send({ 
    result,
    data: activity,
  });
});

// Delete an activity
webServer.delete("/activities/:activityId", async (req, res) => {
  const activityId = req.params.activityId;

  const deletedActivity = await databaseClient.db()
    .collection("activities")
    .findOne({ _id: new ObjectId(activityId) });

  const result = await databaseClient.db()
    .collection("activities")
    .deleteOne({ _id: new ObjectId(activityId) });

  res.send({ 
    result,
    data: deletedActivity,
  });
});

// initialize web server
const currentServer = webServer.listen(PORT, HOSTNAME, () => {
  console.log(`Database connected: ${databaseClient.db().databaseName}`)
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
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