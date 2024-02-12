import databaseClient from "../services/database.mjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { requestUser, requestUserLogin } from "./userrequest.js";
import auth from "../middleware/auth.js";

const createToken = (tokenvalue) => {
  const jwtSecretKey = process.env.TOKEN_KEY;
  const token = jwt.sign({ id: tokenvalue }, jwtSecretKey, {
    expiresIn: "2h",
  });

  return token;
};

// ----------- register -----------

export const userRegister = async (req, res) => {
  try {
    const { first_name, last_name, emailAddress, password } = req.body;
    const { error } = requestUser.validate(req.body);

    //validate
    if (error) {
      return res.status(400).json({
       message: error.details[0].message,
       status:"Bad Request"
      });
    }
    const oldUser = await databaseClient
      .db()
      .collection("users")
      .findOne({ emailAddress });
    if (oldUser) {
      return res.status(409).json({
        message:"User already exist. Please login",
        status:"Conflict"
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
    const token = createToken(user.userId);
    res
      .status(201)
      .cookie("loglife", token, {
        maxAge: 300000,
        secure: true,
        httpOnly: true,
        sameSite: "none",
      })
      .json({
        message: "Signup success",
        status: "Created",
        user: user,
      });
  } catch (error) {
    console.log(error);
  }
};

// ------------ Login --------------

export const userLogin = async (req, res) => {
  // our login logic goes here

  try {
    const { emailAddress, password } = req.body;
    const { error } = requestUserLogin.validate(req.body);

    if (error) {
      return res.status(400).json({
        message:error.details[0].message,
        status:"Bad Request"
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
    if (oldUser && (await bcrypt.compareSync(password, oldUser.password))) {
      const token = createToken(user.userId);
      res
        .status(201)
        .cookie("loglife", token, {
          maxAge: 300000,
          secure: true,
          httpOnly: true,
          sameSite: "none",
        })
        .json({
          message: "login success",
          status: "ok",
          user: user,
        });
    } else {
      res.status(400).json({
       message: "Invalid email or password",
       status: "Bad Request"
      });
    }
  } catch (error) {
    console.log(error);
  }
};
//-------- reset password --------

export const tokenLogin = (req, res) => {
  res.status(200).send("Welcome");
};

//-------- forgot password --------

export const ForgotPassword = async (req, res) => {
  const { emailAddress } = req.body;

  try {
    const oldUser = await databaseClient
      .db()
      .collection("users")
      .findOne({ emailAddress });
    if (oldUser) {
      return res.status(409).send("User already exist. Please login");
    }
  } catch (error) {}
};

export const protectedTokenLogin = [auth, tokenLogin];
