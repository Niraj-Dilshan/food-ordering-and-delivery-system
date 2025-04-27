import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { connectToDatabase } from "./utils/db.util";
import deliveryRoutes from "./routes/delivery.route";

const app = express();

// Middleware
app.use(express.json());

// Database Connection
connectToDatabase();

// Routes
app.use("/api", deliveryRoutes);

export default app;
