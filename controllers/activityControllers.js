import databaseClient from "../services/database.mjs";
import { ObjectId } from "mongodb";
import { requestSchema } from "./requestSchema.js";

export const listActivities = async (req, res) => {
  // validate if userId is a valid ObjectId
  if (!ObjectId.isValid(req.params.userId)) {
    return res.status(400).send("Invalid userId");
  }

  const userId = req.params.userId;

  const activities = await databaseClient
    .db()
    .collection("activities")
    .find({ userId: new ObjectId(userId) })
    .toArray();
  res.send(activities);
};

export const getActivity = async (req, res) => {
  const activityId = req.params.activityId;

  // validate if activityId is a valid ObjectId
  if (!ObjectId.isValid(activityId)) {
    return res.status(400).send("Invalid activityId");
  }

  const activity = await databaseClient
    .db()
    .collection("activities")
    .findOne({ _id: new ObjectId(activityId) });
  res.send(activity);
}

export const createActivity = async (req, res) => {
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

  const result = await databaseClient
    .db()
    .collection("activities")
    .insertOne(activity);

  returnedActivity.activityId = result.insertedId;

  res.send({
    result,
    data: returnedActivity,
  });
}

export const updateActivity = async (req, res) => {
  // validiate request body
  const { error } = requestSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  // validate if userId is a valid ObjectId
  if (!ObjectId.isValid(req.body.userId)) {
    return res.status(400).send("Invalid userId");
  }

  // validate if activityId is a valid ObjectId
  if (!ObjectId.isValid(req.params.activityId)) {
    return res.status(400).send("Invalid activityId");
  }

  // update activity in database
  const userId = new ObjectId(req.body.userId);
  const activity = { ...req.body, userId };
  const activityId = new ObjectId(req.params.activityId);

  const result = await databaseClient
    .db()
    .collection("activities")
    .updateOne({ _id: activityId }, { $set: activity });

  res.send({
    result,
    data: activity,
  });
}

export const deleteActivity = async (req, res) => {
  // validate if activityId is a valid ObjectId
  if (!ObjectId.isValid(req.params.activityId)) {
    return res.status(400).send("Invalid activityId");
  }

  // delete activity from database
  const activityId = new ObjectId(req.params.activityId);

  const result = await databaseClient
    .db()
    .collection("activities")
    .deleteOne({ _id: activityId });

  res.send({
    result,
  });
}
