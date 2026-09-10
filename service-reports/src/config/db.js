import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  console.log(`[service-reports] MongoDB conectado: ${mongoose.connection.name}`);
}
