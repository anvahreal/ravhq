import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

export interface Transaction {
  id: string;
  type: "credit" | "debit";
  name: string;
  amount: number;
  date: string;
  status: "completed" | "pending";
}

interface TransactionListProps {
  transactions: Transaction[];
}

const TransactionList = ({ transactions }: TransactionListProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Recent Transactions</h2>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === "credit" ? "bg-green-100" : "bg-muted"
              }`}>
                {tx.type === "credit" ? (
                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{tx.name}</p>
                <p className="text-sm text-muted-foreground">{tx.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${
                tx.type === "credit" ? "text-green-600" : "text-foreground"
              }`}>
                {tx.type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TransactionList;
