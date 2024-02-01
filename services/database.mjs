import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();
const database = process.env.DATABASE_URI;

const client = new MongoClient(database);

try {
  await client.connect;
} catch (error) {
  console.error(error);
}

export default client;
