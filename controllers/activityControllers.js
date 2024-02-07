import databaseClient from "../services/database.mjs";
import { ObjectId } from "mongodb";
import { requestSchema } from "./requestSchema.js";

/* 
  listActivities query parameters:
    type: null: all activity types,
    type: string: matching string. i.e. "Running", etc.,

    sort: null: descending by date + startTime,
    sort: "date-desc": descending by date + startTime,
    sort: "date-asc": ascending by date + startTime,

    skip: null: 0 skip,
    skip: number: skip [number] of docs,

    0 < take <= 100
    take: null: limit to 20 docs,
    take: number: limit to [number] of docs,
*/
export const listActivities = async (req, res) => {
  // validate if userId is a valid ObjectId
  if (!ObjectId.isValid(req.params.userId)) {
    return res.status(400).send("Invalid userId");
  }

  const userId = new ObjectId(req.params.userId);

  const { type, sort, skip, take } = req.query;

  const filter = { userId };
  if (type) {
    filter.type = type;
  }

  const sortOptions = {};
  if (sort === "date-asc") {
    sortOptions.date = 1;
    sortOptions.startTime = 1;
  } else {
    sortOptions.date = -1;
    sortOptions.startTime = -1;
  }

  const skipOptions = skip ? parseInt(skip) : 0;
  const takeOptions = take ? Math.min(parseInt(take), 100) : 20;

  try {
    const activities = await databaseClient
      .db()
      .collection("activities")
      .aggregate([
        { $match: filter },
        { $sort: sortOptions },
        { $skip: skipOptions },
        { $limit: takeOptions },
        {
          $project: {
            activityId: "$_id",
            _id: 0,
            userId: 1,
            title: 1,
            description: 1,
            type: 1,
            startTime: 1,
            endTime: 1,
            date: 1,
            duration: 1,
            barometer: 1,
          },
        },
      ])
      .toArray();
    res.send(activities);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

export const getActivity = async (req, res) => {
  // validate if activityId is a valid ObjectId
  if (!ObjectId.isValid(req.params.activityId)) {
    return res.status(400).send("Invalid activityId");
  }
  
  const activityId = req.params.activityId;

  try {
    const activity = await databaseClient
      .db()
      .collection("activities")
      .findOne(
        { _id: new ObjectId(activityId) },
        { projection: 
          { _id: 0, 
            userId: 1, 
            title: 1, 
            description: 1, 
            type: 1, 
            startTime: 1, 
            endTime: 1, 
            date: 1, 
            duration: 1, 
            barometer: 1 
          } 
        }
      );
    res.send(activity);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

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

  try {
    const result = await databaseClient
      .db()
      .collection("activities")
      .insertOne(activity);
    res.status(201).send({
      result,
    });
  } catch {
    res.status(500).send(error.message);
  }
};

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

  try {
    const result = await databaseClient
      .db()
      .collection("activities")
      .updateOne({ _id: activityId }, { $set: activity });
    res.send({
      result,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export const deleteActivity = async (req, res) => {
  // validate if activityId is a valid ObjectId
  if (!ObjectId.isValid(req.params.activityId)) {
    return res.status(400).send("Invalid activityId");
  }

  // delete activity from database
  const activityId = new ObjectId(req.params.activityId);

  try {
    const result = await databaseClient
      .db()
      .collection("activities")
      .deleteOne({ _id: activityId });
    res.send({
      result,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
