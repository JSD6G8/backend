import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import databaseClient from "./services/database.mjs";
import { v2 as cloudinary } from "cloudinary";
import * as activityControllers from "./controllers/activityControllers.js";
import * as user from "./controllers/userControllers.js";
import * as activityImageControllers from "./controllers/activityImageControllers.js";
import auth from "./middleware/auth.js";
import cookieParser from "cookie-parser";

const MODE = process.env.NODE_ENV || "production";
const PORT = process.env.SERVER_PORT || 3000;

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

async function uploadToCloudinary(req, res, next) {
  const fileBufferBase64 = Buffer.from(req.file.buffer).toString("base64");
  const base64File = `data:${req.file.mimetype};base64,${fileBufferBase64}`;
  req.cloudinary = await cloudinary.uploader.upload(base64File, {
    resource_type: "auto",
  });

  next();
}

const webServer = express();
//domain access
webServer.use(
  cors({
    origin: true,
    credentials: true,
  })
);
webServer.use(express.json());
webServer.use(helmet());
webServer.use(morgan("dev"));
webServer.use(cookieParser());

// server routes
webServer.get("/", async (req, res) => {
  res.send("Welcome to LogLife API");
});

webServer.get("/activities/user/:userId", auth, activityControllers.listActivities);
webServer.get("/activities/:activityId", activityControllers.getActivity);
webServer.post("/activities", activityControllers.createActivity);
webServer.put("/activities/:activityId", activityControllers.updateActivity);
webServer.delete("/activities/:activityId", activityControllers.deleteActivity);
webServer.post(
  "/activities/:activityId/image",
  upload.single("image"),
  uploadToCloudinary,
  activityImageControllers.createActivityImage
);
webServer.delete(
  "/activities/:activityId/image/:publicId",
  activityImageControllers.deleteActivityImage
);

webServer.post("/signup", user.userRegister);
webServer.post("/login", user.userLogin);
webServer.post("/logout", user.userLogout);
webServer.get("/token", auth, user.tokenLogin);

// initialize web server
if (MODE === "development") {
  const currentServer = webServer.listen(PORT, "localhost", () => {
    console.log(`Database connected: ${databaseClient.db().databaseName}`);
  });
} else {
  const currentServer = webServer.listen(PORT, () => {
    console.log(`Database connected: ${databaseClient.db().databaseName}`);
  });
}

// clean up on exit
function cleanup() {
  currentServer.close(() => {
    console.log("Server closed.");
    try {
      databaseClient.close();
      console.log("Database connection closed.");
    } catch (err) {
      console.error(err);
    }
  });
}

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);
