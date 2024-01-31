import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";
import { ObjectId } from "mongodb";
import databaseClient from "./services/database.mjs";
import { checkMissingField } from "./utils/requestUtils.js";

const webServer = express();
webServer.use(cors());
webServer.use(express.json());

// Use a more specific destination for multer uploads
const upload = multer({ dest: "uploads/" });

dotenv.config();

webServer.get("/", (req, res) => {
    res.status(200).send("Welcome to LogLife API"); // Added a missing semicolon and improved formatting
});

webServer.get("/activities/user/:userId", async (req, res) => {
    const userId = req.params.userId;
    const activitiesData = await databaseClient
        .db()
        .collection("activities-new")
        .find({ userId: new ObjectId(userId) })
        .toArray();
    res.json(activitiesData);
});

webServer.get("/activities/:activityId", async (req, res) => {
    const activityId = req.params.activityId;
    const activitiesData = await databaseClient
        .db()
        .collection("activities-new")
        .find({ _id: new ObjectId(activityId) })
        .toArray();
    res.json(activitiesData);
});

webServer.post("/activities", async (req, res) => {
    const body = req.body;

    if (!body) {
        res.status(400).send("Missing Fields"); 
        return;
    }
    await databaseClient.db().collection("activities-new").insertOne(body);
    res.status(201).send("Create  data successfully"); 
});

webServer.put("/activities/:activityId", async (req, res) => {
    const body = req.body;
    const activityId = req.params.activityId;

    if (!body) {
        res.status(400).send("Missing Fields");
        return;
    }

    await databaseClient.db().collection("activities-new").updateOne(
        { _id: new ObjectId(activityId) },
        { $set: body } // Consider updating specific fields using $set: { field1: value1, field2: value2, ... }
    );
    res.send("Activity updated successfully");
});

webServer.delete("/activities/:activityId", async (req, res) => {
    const activityId = req.params.activityId;
    await databaseClient
        .db()
        .collection("activities-new")
        .deleteOne({ _id: new ObjectId(activityId) });
    res.send("Deleted successfully");
});


const PORT = process.env.PORT || 3000; // Use process.env.PORT if available
webServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
