import { Response } from "express";
import mongoose from "mongoose";
import Expense from "../models/expense";
import { AuthRequest } from "../middleware/auth";

// Create new expense
export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, category, merchant, date, paymentMethod, description } =
      req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const expense = new Expense({
      userId,
      amount,
      category,
      merchant,
      date,
      paymentMethod,
      description,
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get all expenses for user with filters
export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      startDate,
      endDate,
      category,
      limit = "100",
      skip = "0",
      sort = "date",
      order = "desc",
    } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let query: any = { userId };

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    const allowedSortFields = [
      "date",
      "amount",
      "merchant",
      "category",
      "paymentMethod",
    ];
    const sortField = allowedSortFields.includes(sort as string)
      ? (sort as string)
      : "date";
    const sortOrder = order === "asc" ? 1 : -1;
    const sortObj: any = {};
    sortObj[sortField] = sortOrder;
    const expenses = await Expense.find(query)
      .sort(sortObj)
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string));

    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get expense statistics
export const getExpenseStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Build match query with proper ObjectId conversion
    const matchQuery: any = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    // Date range filter
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate as string);
      if (endDate) matchQuery.date.$lte = new Date(endDate as string);
    }

    // Total spending
    const totalResult = await Expense.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalSpending = totalResult.length > 0 ? totalResult[0].total : 0;

    // Category breakdown
    const categoryBreakdown = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Monthly trend
    const monthlyTrend = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            week: { $week: "$date" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } },
    ]);

    // Calculate average daily spend
    const expenses = await Expense.find({
      userId,
      ...(matchQuery.date ? { date: matchQuery.date } : {}),
    });
    let avgDailySpend = 0;
    if (expenses.length > 0) {
      const dates = expenses.map((e) => e.date.getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      const daysDiff =
        Math.ceil(
          (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
      avgDailySpend = totalSpending / daysDiff;
    }

    res.json({
      totalSpending,
      avgDailySpend,
      categoryBreakdown,
      monthlyTrend,
      expenseCount: expenses.length,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update expense
export const updateExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(expense);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Delete expense
export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const expense = await Expense.findOneAndDelete({ _id: id, userId });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
