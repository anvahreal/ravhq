import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TransactionList, { Transaction } from "@/components/TransactionList";
import AnalyticsChart from "@/components/AnalyticsChart";
import { QrCode, Wallet, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalInflow, setTotalInflow] = useState(0);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [weeklyGrowth, setWeeklyGrowth] = useState(0);
  const [chartData, setChartData] = useState<{ day: string; amount: number }[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to access the dashboard.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Fetch transactions for current merchant only (RLS handles filtering)
      const { data: txData, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error loading transactions",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Transform database transactions to UI format
      const formattedTx: Transaction[] = (txData || []).map((tx) => ({
        id: tx.id,
        type: tx.transaction_type as "credit" | "debit",
        name: tx.customer_name,
        amount: Number(tx.amount),
        date: new Date(tx.created_at).toLocaleString(),
        status: tx.status as "completed" | "pending",
      }));

      setTransactions(formattedTx);

      // Calculate total inflow (only credit transactions)
      const inflow = formattedTx
        .filter((tx) => tx.type === "credit")
        .reduce((sum, tx) => sum + tx.amount, 0);
      setTotalInflow(inflow);

      // Calculate weekly analytics from real transaction data
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Get transactions from last 7 days
      const thisWeekTx = (txData || []).filter((tx) => {
        const txDate = new Date(tx.created_at);
        return txDate >= sevenDaysAgo && tx.transaction_type === "credit";
      });

      // Get transactions from previous 7 days
      const lastWeekTx = (txData || []).filter((tx) => {
        const txDate = new Date(tx.created_at);
        return txDate >= fourteenDaysAgo && txDate < sevenDaysAgo && tx.transaction_type === "credit";
      });

      const thisWeekTotal = thisWeekTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
      const lastWeekTotal = lastWeekTx.reduce((sum, tx) => sum + Number(tx.amount), 0);

      setWeeklyTotal(thisWeekTotal);

      // Calculate percentage growth
      if (lastWeekTotal > 0) {
        const growth = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
        setWeeklyGrowth(Math.round(growth));
      } else if (thisWeekTotal > 0) {
        setWeeklyGrowth(100);
      } else {
        setWeeklyGrowth(0);
      }

      // Calculate daily data for chart (last 7 days)
      const dailyData: { day: string; amount: number }[] = [];
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayName = dayNames[date.getDay()];
        
        const dayTotal = (txData || [])
          .filter((tx) => {
            const txDate = new Date(tx.created_at);
            return (
              txDate.toDateString() === date.toDateString() &&
              tx.transaction_type === "credit"
            );
          })
          .reduce((sum, tx) => sum + Number(tx.amount), 0);

        dailyData.push({ day: dayName, amount: dayTotal });
      }

      setChartData(dailyData);
    };
    checkAuth();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Merchant Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your payments and track performance</p>
        </div>

        {/* Balance Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-6 lg:col-span-2 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-primary-foreground/80 text-xs sm:text-sm mb-1">Total Inflow</p>
                <h2 className="text-3xl sm:text-4xl font-bold">${totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="w-full h-11 sm:h-12" asChild>
                <Link to="/payment">
                  <QrCode className="w-4 h-4 mr-2" />
                  <span className="text-sm sm:text-base">Generate QR</span>
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-muted-foreground text-xs sm:text-sm mb-1">This Week</p>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  ${weeklyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                weeklyGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
            {weeklyTotal > 0 ? (
              <p className={`text-xs sm:text-sm font-medium ${
                weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth}% from last week
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">No sales yet this week</p>
            )}
          </Card>
        </div>

        {/* Transactions and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <TransactionList transactions={transactions} />
          <AnalyticsChart data={chartData} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
