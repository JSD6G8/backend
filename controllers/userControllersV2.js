import databaseClient from "../services/database.mjs";
import bcrypt, { compareSync } from "bcrypt";
import jwt from "jsonwebtoken";
import {
  requestUser,
  requestUserLogin,
  requestUserRepassword,
} from "./userrequest.js";
import nodemailer from "nodemailer";
import { ObjectId } from "mongodb";

const createToken = (tokenvalue) => {
    const jwtSecretKey = process.env.TOKEN_KEY;
    const token = jwt.sign(tokenvalue, jwtSecretKey, {
      expiresIn: "2h",
    });
  
    return token;
  };
// -------- sign up --------

export const userRegisterV2 = async (req, res) => {
    try {
      const { first_name, last_name, emailAddress, password } = req.body;
      const { error } = requestUser.validate(req.body);
  
      //validate
      if (error) {
        return res.status(400).json({
          message: error.details[0].message,
          status: "Bad Request",
        });
      }
      const oldUser = await databaseClient
        .db()
        .collection("users")
        .findOne({ emailAddress });
      if (oldUser) {
        return res.status(409).json({
          message: "User already exist. Please login",
          status: "Conflict",
        });
      }
  
      //Encrypt user pass
      const saltRounds = 12;
      const hashedPassword = bcrypt.hashSync(password, saltRounds);
  
      //Create user
      const userCreate = await databaseClient.db().collection("users").insertOne({
        first_name,
        last_name,
        emailAddress,
        password: hashedPassword,
      });
  
      const user = await databaseClient
        .db()
        .collection("users")
        .findOne(
          { emailAddress },
          {
            projection: {
              userId: "$_id",
              _id: 0,
              first_name: 1,
              last_name: 1,
              emailAddress: 1,
            },
          }
        );
  
      // Token
      const token = createToken({
        userId: user.userId,
        first_name: user.first_name,
      });
      res
        .status(201)
        .json({
          message: "Signup success",
          status: "Created",
          token:token,
          user: user,
        });
    } catch (error) {
      console.log(error);
    }
  };

//-------- login --------

export const userLoginV2 = async (req, res) => {
    // our login logic goes here
  
    try {
      const { emailAddress, password } = req.body;
      const { error } = requestUserLogin.validate(req.body);
  
      if (error) {
        return res.status(400).json({
          message: error.details[0].message,
          status: "Bad Request",
        });
      }
  
      const oldUser = await databaseClient
        .db()
        .collection("users")
        .findOne({ emailAddress });
  
      const user = await databaseClient
        .db()
        .collection("users")
        .findOne(
          { emailAddress },
          {
            projection: {
              userId: "$_id",
              _id: 0,
              first_name: 1,
              last_name: 1,
              emailAddress: 1,
            },
          }
        );
      //create token
      if (oldUser && bcrypt.compareSync(password, oldUser.password)) {
        const token = createToken({
          userId: user.userId,
          first_name: user.first_name,
        });
        res.status(200).json({
          message: "login success",
          status: "ok",
          token:token,
          user: user,
        });
      } else {
        res.status(400).json({
          message: "Invalid email or password",
          status: "Bad Request",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  // -------- logout --------

  export const userLogoutV2 = (req, res) => {
    res.status(200).json({ message: "Logout success", status: "ok" });
  };

  ///////////
  export const tokenLogin = (req, res) => {
    res.status(200).send({ user: req.user });
    // res.status(200).send("pass");
  };