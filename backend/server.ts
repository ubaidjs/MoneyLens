import express from "express";
import mongoose from "mongoose";
import homeRouter from "./routes/home";
import userRouter from "./routes/user";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/moneylens";

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/", homeRouter);
app.use("/users", userRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
