
import databaseClient from "../services/database.mjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { requestUser, requestUserLogin } from "./userrequest.js";
import auth from "../middleware/auth.js";

//TODO projection
//TODO email => uid

// ----------- register -----------
export const userRegister = async (req, res) => {
  // our register logic goes here
  try {
    const { first_name, last_name, emailAddress, password } = req.body;
    const { error } = requestUser.validate(req.body);

    if (error) {
      return res.status(400).send(error.details[0].message);
    }

    const oldUser = await databaseClient
      .db()
      .collection("users")
      .findOne({ emailAddress });

    if (oldUser) {
      return res.status(409).send("User already exist. Please login");
    }

    //Encrypt user pass
    const saltRounds = 12;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    //Create user
    const user = await databaseClient.db().collection("users").insertOne({
      first_name,
      last_name,
      emailAddress,
      password: hashedPassword,
    });

    const user_id = await databaseClient
    .db()
    .collection("users")
    .findOne({ emailAddress });
    
    // Token
    const jwtSecretKey = process.env.TOKEN_KEY;
    const token = jwt.sign({ id: emailAddress }, jwtSecretKey, {
      expiresIn: "2h",
    });

    res.status(201).json(user);
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
      return res.status(400).send(error.details[0].message);
    }

    const user = await databaseClient
      .db()
      .collection("users")
      .findOne({ emailAddress });

    if (user && (await bcrypt.compareSync(password, user.password))) {
      const jwtSecretKey = process.env.TOKEN_KEY;
      const token = jwt.sign({ id: emailAddress }, jwtSecretKey, {
        expiresIn: "2h",
      });
      res.status(201).cookie('loglife',token,{
        maxAge: 300000,
        secure: true,
        httpOnly: true,
        sameSite: "none",
      })

      res.json({
        message:'login success',
        user:user
      })

    } else {
      res.status(400).send("Invalid email or password");
    }
  } catch (error) {
    console.log(error);
  }
};

export const tokenLogin = (req, res) => {
   res.status(200).send("Welcome");
};

export const protectedTokenLogin = [auth, tokenLogin];
