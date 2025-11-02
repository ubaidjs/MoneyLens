import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useEffect, useState } from "react";
import type { Route } from "./+types/all-expenses";
import AddExpenseModal from "~/components/AddExpenseModal";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "All Expenses - MoneyLens" },
    { name: "description", content: "View all your expenses" },
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

type SortField = "date" | "amount" | "merchant" | "category" | "paymentMethod";
type SortOrder = "asc" | "desc";
type DateFilter =
  | "Today"
  | "This Week"
  | "This Month"
  | "This Year"
  | "Custom"
  | "All Time";

export default function AllExpenses() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [dateFilter, setDateFilter] = useState<DateFilter>("All Time");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const itemsPerPage = 20;

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchExpenses();
    }
  }, [isAuthenticated, currentPage, sortField, sortOrder, dateFilter]);

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();

    switch (dateFilter) {
      case "Today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "This Week":
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "This Month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "This Year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "Custom":
        startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0); // Last day of selected month
        return {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };
      case "All Time":
        return {};
    }

    return { startDate: startDate.toISOString(), endDate: now.toISOString() };
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const skip = (currentPage - 1) * itemsPerPage;
      const { startDate, endDate } = getDateRange();
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        skip: skip.toString(),
        sort: sortField,
        order: sortOrder,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const response = await fetch(`http://localhost:3000/expenses?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
        // Fetch total count
        const countParams = new URLSearchParams({
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        });
        const countResponse = await fetch(
          `http://localhost:3000/expenses/stats?${countParams}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (countResponse.ok) {
          const statsData = await countResponse.json();
          setTotalExpenses(statsData.expenseCount || 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleExpenseAdded = () => {
    fetchExpenses();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/expenses/${expenseId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        fetchExpenses();
      } else {
        alert("Failed to delete expense");
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
      alert("Failed to delete expense");
    }
  };

  if (!user) {
    return null;
  }

  const categories = [
    "All",
    ...Array.from(new Set(expenses.map((e) => e.category))),
  ];

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" || expense.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(totalExpenses / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-60 bg-white shadow-lg flex flex-col">
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
            <button
              onClick={() => navigate("/dashboard")}
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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>
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
      <div className="ml-60 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            All Expenses
          </h1>
          <p className="text-gray-600">
            Viewing {filteredExpenses.length} of {totalExpenses} expenses
          </p>
          <div className="flex gap-2 mt-4">
            {(
              [
                "Today",
                "This Week",
                "This Month",
                "This Year",
                "Custom",
                "All Time",
              ] as DateFilter[]
            ).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  if (filter === "Custom") {
                    setIsDateModalOpen(true);
                  } else {
                    setDateFilter(filter);
                    setCurrentPage(1);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === filter
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {filter === "Custom" && dateFilter === "Custom"
                  ? `${new Date(selectedYear, selectedMonth - 1).toLocaleString("default", { month: "long" })} ${selectedYear}`
                  : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by merchant, category, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    onClick={() => handleSort("date")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      {sortField === "date" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("merchant")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Merchant</span>
                      {sortField === "merchant" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("category")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Category</span>
                      {sortField === "category" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th
                    onClick={() => handleSort("amount")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Amount</span>
                      {sortField === "amount" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("paymentMethod")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Payment Method</span>
                      {sortField === "paymentMethod" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Loading expenses...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No expenses found.
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
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {expense.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${expense.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {expense.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleExpenseAdded}
      />

      {/* Date Selection Modal */}
      {isDateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Select Month and Year
              </h2>
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(0, month - 1).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {Array.from(
                    { length: 6 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsDateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setDateFilter("Custom");
                    setCurrentPage(1);
                    setIsDateModalOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
