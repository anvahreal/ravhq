import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Printer } from "lucide-react";

export interface Transaction {
  id: string;
  type: "credit" | "debit";
  name: string;
  amount: number;
  date: string;
  status: "completed" | "pending";
  txHash?: string;
  network?: string;
  productName?: string;
  quantity?: number;
}

interface TransactionListProps {
  transactions: Transaction[];
}

const TransactionList = ({ transactions }: TransactionListProps) => {
  const [visibleCount, setVisibleCount] = useState(5);

  const visibleTransactions = transactions.slice(0, visibleCount);
  const hasMore = visibleCount < transactions.length;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 5, transactions.length));
  };

  const showAll = () => {
    setVisibleCount(transactions.length);
  };

  const printReceipt = (transaction: Transaction) => {
    const receiptWindow = window.open('', '_blank', 'width=600,height=800');
    if (!receiptWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - ${transaction.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            padding: 40px;
            max-width: 400px;
            margin: 0 auto;
            background: white;
          }
          .receipt {
            border: 2px dashed #000;
            padding: 30px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: 2px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
          }
          .section {
            margin: 20px 0;
            padding: 15px 0;
            border-bottom: 1px dashed #999;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 14px;
          }
          .label {
            font-weight: bold;
          }
          .total {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #000;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #000;
            font-size: 12px;
          }
          .blockchain {
            background: #f5f5f5;
            padding: 10px;
            margin: 15px 0;
            font-size: 11px;
            word-break: break-all;
          }
          .status {
            display: inline-block;
            padding: 4px 12px;
            background: ${transaction.status === 'completed' ? '#22c55e' : '#eab308'};
            color: white;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">RAV PAY</div>
            <div style="font-size: 12px; margin-top: 5px;">Blockchain Payment System</div>
            <div class="title">PAYMENT RECEIPT</div>
          </div>

          <div class="section">
            <div class="row">
              <span class="label">Receipt ID:</span>
              <span>${transaction.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div class="row">
              <span class="label">Date:</span>
              <span>${transaction.date}</span>
            </div>
            <div class="row">
              <span class="label">Status:</span>
              <span class="status">${transaction.status.toUpperCase()}</span>
            </div>
          </div>

          <div class="section">
            <div class="row">
              <span class="label">Customer:</span>
              <span>${transaction.name}</span>
            </div>
            ${transaction.productName ? `
            <div class="row">
              <span class="label">Product:</span>
              <span>${transaction.productName}</span>
            </div>
            ` : ''}
            ${transaction.quantity ? `
            <div class="row">
              <span class="label">Quantity:</span>
              <span>${transaction.quantity}</span>
            </div>
            ` : ''}
          </div>

          <div class="total">
            <div class="total-row">
              <span>TOTAL PAID:</span>
              <span>$${transaction.amount.toFixed(2)}</span>
            </div>
          </div>

          ${transaction.txHash && transaction.network ? `
          <div class="section">
            <div style="font-weight: bold; margin-bottom: 10px;">🔒 Blockchain Verification</div>
            <div class="row">
              <span class="label">Network:</span>
              <span>${transaction.network === 'celo' ? 'Celo' : 'Base'} Testnet</span>
            </div>
            <div class="blockchain">
              <div style="font-weight: bold; margin-bottom: 5px;">Transaction Hash:</div>
              <div>${transaction.txHash}</div>
            </div>
            <div style="font-size: 10px; margin-top: 10px;">
              Verify at: ${transaction.network === 'celo' 
                ? 'https://celo-sepolia.blockscout.com' 
                : 'https://sepolia.basescan.org'}/tx/${transaction.txHash}
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <div style="margin-bottom: 10px;">Thank you for your business!</div>
            <div style="font-size: 10px; color: #666;">
              Powered by RAV Payment System<br>
              Blockchain • Instant Settlement • Low Fees
            </div>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 12px 24px; font-size: 16px; cursor: pointer; background: #06b6d4; color: white; border: none; border-radius: 6px; font-weight: bold;">
            🖨️ Print Receipt
          </button>
          <button onclick="window.close()" style="padding: 12px 24px; font-size: 16px; cursor: pointer; background: #64748b; color: white; border: none; border-radius: 6px; margin-left: 10px;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-foreground">Recent Transactions</h2>
      
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No transactions yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {visibleTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    transaction.type === "credit" 
                      ? "bg-green-100 text-green-600" 
                      : "bg-red-100 text-red-600"
                  }`}>
                    {transaction.type === "credit" ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{transaction.name}</p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === "credit" 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`}>
                      {transaction.type === "credit" ? "+" : "-"}${transaction.amount.toFixed(2)}
                    </p>
                    <Badge 
                      variant={transaction.status === "completed" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => printReceipt(transaction)}
                    title="Print Receipt"
                    className="flex-shrink-0"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={loadMore}
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Load More ({transactions.length - visibleCount} remaining)
              </Button>
              <Button 
                variant="ghost" 
                onClick={showAll}
              >
                Show All
              </Button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Showing {visibleCount} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </>
      )}
    </Card>
  );
};

export default TransactionList;