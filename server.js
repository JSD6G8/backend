import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import databaseClient from "./services/database.mjs";
import { v2 as cloudinary } from "cloudinary";
import * as activityControllers from "./controllers/activityControllers.js";
import * as activityControllersV2 from "./controllers/activityControllersV2.js";
import * as userControllers from "./controllers/userControllers.js";
import * as userControllersV2 from "./controllers/userControllersV2.js"
import * as activityImageControllers from "./controllers/activityImageControllers.js";
import auth from "./middleware/auth.js";
import authV2 from "./middleware/authV2.js";
import cookieParser from "cookie-parser";
import * as dashboardControllers from "./controllers/dashboardController.js";

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

// activities endpoints version 1
// webServer.get("/activities/user/:userId", activityControllers.listActivities);
// webServer.get("/activities/:activityId", activityControllers.getActivity);
// webServer.post("/activities", activityControllers.createActivity);
// webServer.put("/activities/:activityId", activityControllers.updateActivity);
// webServer.delete("/activities/:activityId", activityControllers.deleteActivity);
// webServer.post(
//   "/activities/:activityId/image",
//   upload.single("image"),
//   uploadToCloudinary,
//   activityImageControllers.createActivityImage
// );
// webServer.delete(
//   "/activities/:activityId/image/:publicId",
//   activityImageControllers.deleteActivityImage
// );

// activities endpoints version 2
webServer.get("/v2/activities/user/me", auth, activityControllersV2.listActivities);
webServer.get("/v2/activities/:activityId", auth, activityControllersV2.getActivity);
webServer.post("/v2/activities", auth, activityControllersV2.createActivity);
webServer.put("/v2/activities/:activityId", auth, activityControllersV2.updateActivity);
webServer.delete("/v2/activities/:activityId", auth, activityControllers.deleteActivity);
webServer.post(
  "/v2/activities/:activityId/image",
  auth,
  upload.single("image"),
  uploadToCloudinary,
  activityImageControllers.createActivityImage
);
webServer.delete(
  "/v2/activities/:activityId/image/:publicId",
  auth,
  activityImageControllers.deleteActivityImage
);

// dashboard endpoints
webServer.get("/dashboard", auth, dashboardControllers.getDashboard);

// users endpoints
webServer.post("/signup", userControllers.userRegister);
webServer.post("/login", userControllers.userLogin);
webServer.post("/logout", userControllers.userLogout);
webServer.get("/token", auth, userControllers.tokenLogin);
webServer.patch("/resetpassword", userControllers.resetPassword);
webServer.post("/forgotpassword", userControllers.ForgotPassword);

webServer.get("/users/me", auth, userControllers.getUser);

// users endpoints version 2
// webServer.post("/V2/signup", userControllersV2.userRegisterV2);
// webServer.post("/V2/login", userControllersV2.userLoginV2);
// webServer.post("/V2/logout", userControllersV2.userLogoutV2);
// webServer.get("/V2/token", authV2, userControllersV2.tokenLogin);


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
