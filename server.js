import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import databaseClient from "./services/database.mjs";
import { MongoClient,ObjectId } from "mongodb";

const HOSTNAME = process.env.SERVER_IP || "127.0.0.1";
const PORT = process.env.SERVER_PORT || 3000;

// setting initial configuration for upload file, web server (express), and cors
dotenv.config();
const webServer = express();
webServer.use(cors());
webServer.use(express.json());


//routers
webServer.get("/activity/user/:userId", async (req,res) => {
  const userId = req.params.userId;
  const activityData = await databaseClient
    .db()
    .collection("activity")
    .find({userId: new ObjectId(userId)})
    .toArray();
  res.json(activityData);
});


webServer.get("/activities/:activityId", async (req,res) => {
  const activityId = req.params.activityId;
  const activityData = await databaseClient
    .db()
    .collection("activity")
    .find({_id: new ObjectId(activityId)})
    .toArray();
  res.json(activityData);
});

webServer.delete("/activities/:activityId", async (req,res) => {
  const activityId = req.params.activityId;
  const activityData = await databaseClient
    .db()
    .collection("activity")
    .deleteOne({_id: new ObjectId(activityId)});
  res.json(`${activityData} is deleted`);
});

webServer.post("/activities", async (req,res) => {
  const body = { ...req.body };

  if (!body) {
    res.send('missing fields');
    console.log(body);
    return;
  }
  
  await databaseClient.db().collection("activity").insertOne(body);
  res.send("Create User Successfully");
});

webServer.put("/activities/:activityId", async (req,res) => {
  console.log(req.body);
  const body = req.body ;
  const activityId = req.params.activityId;
  if (!body) {
    res.send('missing fields');
    console.log(body);
    return;
  }
  
  const result =  await databaseClient.db().collection("activity").updateOne(
    { _id: new ObjectId (activityId)},
    { $set: body }
    );
  res.send(result);
});


// initilize web server
const currentServer = webServer.listen(PORT, HOSTNAME, () => {
    console.log(
      `DATABASE IS CONNECTED: NAME => ${databaseClient.db().databaseName}`
    );
    console.log(`SERVER IS ONLINE => http://${HOSTNAME}:${PORT}`);
  });
  
  const cleanup = () => {
    currentServer.close(() => {
      console.log(
        `DISCONNECT DATABASE: NAME => ${databaseClient.db().databaseName}`
      );
      try {
        databaseClient.close();
      } catch (error) {
        console.error(error);
      }
    });
  };
  
  // cleanup connection such as database
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
  