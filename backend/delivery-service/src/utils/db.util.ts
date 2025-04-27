import mongoose from "mongoose";

// Default to the delivery service database if not specified
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/nomnom-delivery-db";

// This will define which database to use
// We'll use the same MongoDB instance but will specify different databases
// when creating models using mongoose.model('ModelName', schema, 'collectionName')
if (!MONGO_URI) {
  console.error("MongoDB URI is not defined in the environment variables.");
  process.exit(1);
}

export const connectToDatabase = async (): Promise<void> => {
  try {
    // Connect to the main database
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
    
    // Set up global configuration for Mongoose
    mongoose.set('strictQuery', true);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};
