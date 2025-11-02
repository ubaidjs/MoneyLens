import mongoose, { Document, Schema } from "mongoose";

export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  category: string;
  merchant: string;
  date: Date;
  paymentMethod: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Groceries",
        "Transport",
        "Utilities",
        "Dining",
        "Shopping",
        "Entertainment",
        "Healthcare",
        "Education",
        "Other",
      ],
    },
    merchant: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: [
        "Cash",
        "Credit Card",
        "Debit Card",
        "Digital Wallet",
        "Bank Transfer",
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by user and date
expenseSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IExpense>("Expense", expenseSchema);
