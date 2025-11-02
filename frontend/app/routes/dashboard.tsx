import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useEffect, useState } from "react";
import type { Route } from "./+types/dashboard";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import AddExpenseModal from "~/components/AddExpenseModal";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - MoneyLens" },
    { name: "description", content: "Your MoneyLens dashboard" },
  ];
}

interface Expense {
  _id: string;
  amount: number;
  category: string;
  merchant: string;
  date: string;
  paymentMethod: string;
  description?: string;
}

interface Stats {
  totalSpending: number;
  avgDailySpend: number;
  categoryBreakdown: Array<{ _id: string; total: number; count: number }>;
  monthlyTrend: Array<{
    _id: { year: number; month: number; week: number };
    total: number;
    count: number;
  }>;
}

type DateFilter = "This Month" | "Last 30 Days" | "This Year" | "Custom Range";

export default function Dashboard() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("This Month");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statsLoading, setStatsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchExpenses();
      fetchStats();
    }
  }, [isAuthenticated, dateFilter]);

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();

    switch (dateFilter) {
      case "This Month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "Last 30 Days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "This Year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate: startDate.toISOString(), endDate: now.toISOString() };
  };

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("token");
      const { startDate, endDate } = getDateRange();
      const response = await fetch(
        `http://localhost:3000/expenses?startDate=${startDate}&endDate=${endDate}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { startDate, endDate } = getDateRange();
      const response = await fetch(
        `http://localhost:3000/expenses/stats?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched stats:", data);
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleExpenseAdded = () => {
    fetchExpenses();
    fetchStats();
  };

  if (!user) {
    return null;
  }

  const budget = 4000;
  const budgetRemaining = budget - (stats?.totalSpending || 0);

  // Color palette for charts
  const COLORS = [
    "#4f46e5",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
  ];

  // Calculate trend from monthly data
  const calculateTrend = () => {
    if (!stats?.monthlyTrend || stats.monthlyTrend.length < 2) return 0;
    const current =
      stats.monthlyTrend[stats.monthlyTrend.length - 1]?.total || 0;
    const previous =
      stats.monthlyTrend[stats.monthlyTrend.length - 2]?.total || 0;
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const totalChange = calculateTrend();

  // Prepare chart data
  const trendData =
    stats?.monthlyTrend.map((item, index) => ({
      name: `Week ${item._id.week}`,
      amount: item.total,
    })) || [];

  const categoryData =
    stats?.categoryBreakdown
      .slice(0, 5)
      .map((item) => ({
        name: item._id,
        amount: item.total,
      }))
      .sort((a, b) => b.amount - a.amount) || [];

  // Pie chart data for categories
  const categoryPieData =
    stats?.categoryBreakdown.map((item) => ({
      name: item._id,
      value: item.total,
    })) || [];

  // Payment method breakdown
  const paymentMethodData = expenses.reduce((acc: any[], expense) => {
    const existing = acc.find((item) => item.name === expense.paymentMethod);
    if (existing) {
      existing.value += expense.amount;
      existing.count += 1;
    } else {
      acc.push({
        name: expense.paymentMethod,
        value: expense.amount,
        count: 1,
        fill: COLORS[acc.length % COLORS.length],
      });
    }
    return acc;
  }, []);

  // Cumulative spending data (area chart)
  const cumulativeData = (() => {
    const sortedExpenses = [...expenses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let cumulative = 0;
    return sortedExpenses.map((expense) => {
      cumulative += expense.amount;
      return {
        date: new Date(expense.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        amount: cumulative,
      };
    });
  })();

  // Transaction count by category
  const transactionCountData =
    stats?.categoryBreakdown
      .map((item) => ({
        name: item._id,
        count: item.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6) || [];

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isMobileMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-60 bg-white shadow-lg flex flex-col transform transition-transform duration-300 z-40 ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {user.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button className="w-full flex items-center space-x-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => navigate("/all-expenses")}
              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <span className="font-medium">All Expenses</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          >
            Add Expense
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-60 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-12 lg:mt-0">
            Dashboard
          </h1>
          <div className="flex flex-wrap gap-2">
            {(
              [
                "This Month",
                "Last 30 Days",
                "This Year",
                "Custom Range",
              ] as DateFilter[]
            ).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === filter
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Total Spending
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              ${statsLoading ? "..." : (stats?.totalSpending || 0).toFixed(2)}
            </p>
            <p
              className={`text-sm ${totalChange >= 0 ? "text-red-600" : "text-green-600"}`}
            >
              {totalChange >= 0 ? "+" : ""}
              {totalChange.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Average Daily Spend
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              ${statsLoading ? "..." : (stats?.avgDailySpend || 0).toFixed(2)}
            </p>
            <p
              className={`text-sm ${stats?.avgDailySpend && stats.avgDailySpend > 100 ? "text-red-600" : "text-green-600"}`}
            >
              {stats?.avgDailySpend && stats.avgDailySpend > 100
                ? "↑ High"
                : "↓ Good"}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Total Transactions
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {statsLoading ? "..." : expenses.length}
            </p>
            <p className="text-sm text-gray-500">{dateFilter}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Top Category
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              ${categoryData[0]?.amount.toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-gray-500">
              {categoryData[0]?.name || "N/A"}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
          {/* Spending Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Weekly Spending Trend
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${(stats?.totalSpending || 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                {dateFilter}{" "}
                <span
                  className={
                    totalChange >= 0 ? "text-red-600" : "text-green-600"
                  }
                >
                  {totalChange >= 0 ? "+" : ""}
                  {totalChange.toFixed(1)}%
                </span>
              </p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ fill: "#4f46e5", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Category Distribution
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {categoryPieData.length} Categories
              </p>
              <p className="text-sm text-gray-500">
                Spending breakdown by category
              </p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) =>
                    `${entry.name} ${(entry.percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Categories Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Top Spending Categories
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${categoryData[0]?.amount.toFixed(2) || "0.00"}
              </p>
              <p className="text-sm text-gray-500">
                On {categoryData[0]?.name || "N/A"}
              </p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cumulative Spending Area Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Cumulative Spending
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                $
                {cumulativeData[cumulativeData.length - 1]?.amount.toFixed(2) ||
                  "0.00"}
              </p>
              <p className="text-sm text-gray-500">
                Total accumulated over time
              </p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
          {/* Payment Method Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Methods
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {paymentMethodData.length} Methods
              </p>
              <p className="text-sm text-gray-500">
                Distribution by payment type
              </p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="90%"
                data={paymentMethodData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background
                  dataKey="value"
                  label={{
                    position: "insideStart",
                    fill: "#fff",
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={(value, entry: any) =>
                    `${value}: $${entry.payload.value.toFixed(2)}`
                  }
                />
                <Tooltip
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Transaction Count by Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Transaction Frequency
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {transactionCountData[0]?.count || 0} Transactions
              </p>
              <p className="text-sm text-gray-500">
                Most frequent: {transactionCountData[0]?.name || "N/A"}
              </p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={transactionCountData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  width={80}
                />
                <Tooltip
                  formatter={(value: number) => `${value} transactions`}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {transactionCountData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Expenses
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Merchant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No expenses found. Click "Add Expense" to get started!
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.merchant}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${expense.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {expense.paymentMethod}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredExpenses.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No expenses found. Click "Add Expense" to get started!
              </div>
            ) : (
              filteredExpenses.map((expense) => (
                <div key={expense._id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {expense.merchant}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${expense.amount.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                      {expense.category}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {expense.paymentMethod}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleExpenseAdded}
      />
    </div>
  );
}
