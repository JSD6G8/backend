import databaseClient from "../services/database.mjs";
import { ObjectId } from "mongodb";
import { v2 as cloudinary } from "cloudinary";

export const createActivityImage = async (req, res) => {
  // validate if activityId is a valid ObjectId
  if (!ObjectId.isValid(req.params.activityId)) {
    return res.status(400).send("Invalid activityId");
  }

  // insert image into database
  const activityId = new ObjectId(req.params.activityId);
  const image = {
    url: req.cloudinary.secure_url,
    publicId: req.cloudinary.public_id,
  }

  try {
    const result = await databaseClient
      .db()
      .collection("activities")
      .updateOne(
        { _id: activityId },
        { $set: { image } }
      );
    res.status(201).send({
        result,
        });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
