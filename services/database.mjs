import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.DATABASE_URI);

try {
  await client.connect();
  console.log("Connected to database"); 
} catch (err) {
  console.error(err);
}

export default client;