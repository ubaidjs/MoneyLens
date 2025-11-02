import express from "express";
import {
  createExpense,
  getExpenses,
  getExpenseStats,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post("/", createExpense);
router.get("/", getExpenses);
router.get("/stats", getExpenseStats);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;
