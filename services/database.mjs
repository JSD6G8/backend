import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.DATABASE_URI);

try {
  await client.connect();
} catch (error) {
  console.error(error);
}

export default client;
