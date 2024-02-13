import databaseClient from "../services/database.mjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  requestUser,
  requestUserLogin,
  requestUserRepassword,
} from "./userrequest.js";
import auth from "../middleware/auth.js";
import nodemailer from "nodemailer";
// import { sendEmail } from "./email.js";

//funtion
function generateOTP() {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

const sendEmail = async (emailAddress,otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "hotmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.USER_EMAIL,
      to: emailAddress,
      subject: "OTP for verification on LOGLIFE",
      html: `<p>แจ้งรหัสเพื่อยืยยันการเปลี่ยนรหัสผ่าน</p><br/>
             <p>    OTP: ${otp}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.log(error);
    res.status(400).json({message:"can't send email",status:"error"});
  }
};

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
        status: "Bad Request",
      });
    }
  } catch (error) {
    console.log(error);
  }
};
//TODO:-------- reset password --------

export const resetPassword = async (req, res) => {
  const {emailAddress, newPassword} = req.body
  const { error } = requestUserRepassword.validate(req.body);

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
  if (!oldUser) {
    return res.status(400).json({
      message: "not found user",
      status: "Bad Request",
    });
  } 
  const saltRounds = 12;
  const hashedPassword = bcrypt.hashSync(newPassword, saltRounds);
  const result = await databaseClient
      .db()
      .collection("users")
      .updateOne({ emailAddress: emailAddress }, { $set: {password: hashedPassword }});
  res.status(200).json({message:"Updata password success",status:"Ok"});
};

//TODO: -------- forgot password --------

let otp;
export const ForgotPassword = async (req, res) => {
  const { emailAddress, user_otp } = req.body;
  const { error } = requestUserRepassword.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
      status: "Bad Request",
    });
  }

  try {
    const oldUser = await databaseClient
      .db()
      .collection("users")
      .findOne({ emailAddress });

    if (!oldUser) {
      return res.status(409).json({ message: "Invalid email", status: "Bad Request" });
    }

    if (!user_otp) {
      otp = generateOTP();
      console.log(otp);
      // await sendEmail(emailAddress, otp); // ส่ง OTP ไปยังอีเมล์ของผู้ใช้
      return res.status(200).json({ message: "OTP Created", status: "Ok" });
    }

    console.log("otp is", otp);
    const otpCheck = user_otp === otp;
    if (otpCheck) {
      return res.status(200).json({ message: "OTP is correct", status: "Ok" });
    } else {
      return res.status(400).json({ message: "Invalid OTP", status: "Bad Request" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", status: "Internal Server Error" });
  }
};

// export const protectedTokenLogin = [auth, tokenLogin];
