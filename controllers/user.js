import databaseClient from "../services/database.mjs";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { requestUser } from "./userrequest.js";


// register
export const userRegister = async (req, res) => {
    // our register logic goes here
    try {

        const {first_name, last_name, emailAddress, password } = req.body;
        const { error } = requestUser.validate(req.body);

        if(error){
            return res.status(400).send(error.details[0].message);
        }

        const oldUser = await databaseClient
            .db()
            .collection("user")
            .findOne({ emailAddress });

        if (oldUser) {
            return res.status(409).send("User already exist. Please login")
        }

        //Encrypt user pass
        const saltRounds = 12;
        const hashedPassword = bcrypt.hashSync(password, saltRounds);

        //Create user
        const user = await databaseClient
            .db() 
            .collection("user")
            .insertOne({
            first_name,
            last_name,
            emailAddress,
            password: hashedPassword
        });

        // Token
        const user_id = await databaseClient
            .db()
            .collection("user")
            .findOne({ emailAddress })
        const token = jwt.sign(
            { user_id: user_id,emailAddress},
            process.env.TOKEN_KEY,
            {
                expiresIn:"2h"
            }
        )

        //save token
        user.token
       
        res.status(201).json(user);

    } catch (error) {
        console.log(error);
    }
}
// Login
export const userLogin = async (req, res) => {
    // our login logic goes here
}