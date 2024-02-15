import databaseClient from "../services/database.mjs";
import bcrypt, { compareSync } from "bcrypt";
import jwt from "jsonwebtoken";
import {
  requestUser,
  requestUserLogin,
  requestUserRepassword,
} from "./userrequest.js";
import nodemailer from "nodemailer";

const MODE = process.env.NODE_ENV || "production";

//funtion

function generateRef(length) {
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = '';
  for (let i = 0; i < length; i++) {
      ref += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return ref;
}

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
        user: process.env.USER_EMAIL || process.env.USER_EMAIL_SECOND,
        pass: process.env.USER_PASSWORD || process.env.USER_PASSWORD_SECOND,
      },
    });

    let mailOptions = {
      from: process.env.USER_EMAIL || process.env.USER_EMAIL_SECOND,
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
        .status(200)
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

export const tokenLogin = (req, res) => {
  res.status(200).send("Welcome");
};
//TODO:-------- reset password --------

export const resetPassword = async (req, res) => {
  
  try {
    const {emailAddress, newPassword} = req.body
    const { error } = requestUserRepassword.validate(req.body);
    const userRef = req.cookies._llf || false

    //validate
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
        status: "Bad Request",
      });
    }
    const verifyRef = await databaseClient
      .db()
      .collection("verifications")
      .findOne({ userRef:userRef });
  
      if(!verifyRef) {
        return res.status(400).json({message:"Bad Request",status:"Bad Request"})
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
    res.status(200).json({message:"Password updated successfully",status:"Ok"});
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", status: "Internal Server Error" ,error:error});
  }

};

//TODO: -------- forgot password --------

export const ForgotPassword = async (req, res) => {
  let otp;
  let ref;
  const { emailAddress, user_otp } = req.body;
  const userRef = req.cookies._llf
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
      return res.status(400).json({ message: "Invalid email", status: "Bad Request" });
    }
    
    if (!user_otp) {
  
      otp = generateOTP();
      ref = generateRef(6);
      if (MODE === "development"){
        console.log("ref: ",ref);
        console.log("otp: ",otp);
      }
      const hashedOtp = bcrypt.hashSync(otp, 10);

      const otpCreate = await databaseClient
            .db()
            .collection("verifications")
            .insertOne({
              emailAddress:emailAddress,
              userOtp:hashedOtp,
              userRef:ref,
              "createdAt": new Date()
            });
      if (MODE === "production") {
        await sendEmail(emailAddress, otp); // ส่ง OTP ไปยังอีเมล์ของผู้ใช้
      }
      return res.status(200).cookie("_llf", ref, {
        maxAge: 1800000 ,
        secure: true,
        httpOnly: true,
        sameSite: "none",
      }).json({ message: "REF and OTP sended", status: "Ok" });
    }

    const verificationData = await databaseClient
          .db()
          .collection("verifications")
          .findOne({userRef:userRef})

          
    const compareOtp = await bcrypt.compareSync(user_otp,verificationData.userOtp);
    const checkRef = verificationData.userRef === userRef;
    if(MODE === "development"){
      console.log("compareOtp is ",compareOtp);
      console.log("compareRef is ",checkRef);
    }


    if (compareOtp && checkRef) {
      return res.status(200).json({ message: "OTP is correct", status: "Ok" });
    } else {
      return res.status(400).json({ message: "Invalid OTP", status: "Bad Request" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", status: "Internal Server Error" ,error:error});
  }
};

