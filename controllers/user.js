import databaseClient from "../services/database.mjs";
import bcrypt from 'bcrypt';



// register
export const userRegister = async (req, res) => {
    // our register logic goes here
    try {

        const {first_name, last_name, email, password } = req.body;

        if (!(email && password && first_name && last_name)) {
            res.status(400).send("All input is requiried")
        }

        const oldUser = await databaseClient
            .db()
            .collection("user")
            .findOne({ email });

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
            email,
            password: hashedPassword
        });
       
        res.status(201).json(user);

    } catch (error) {
        console.log(error);
    }
}
// Login
export const userLogin = async (req, res) => {
    // our login logic goes here
}