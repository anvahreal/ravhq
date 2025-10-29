import { Card } from "@/components/ui/card";

interface ChartData {
  day: string;
  amount: number;
}

interface AnalyticsChartProps {
  data: ChartData[];
}

const AnalyticsChart = ({ data }: AnalyticsChartProps) => {
  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-foreground">Daily Payments</h2>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">{item.day}</span>
              <span className="font-medium text-foreground">${item.amount}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${(item.amount / maxAmount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AnalyticsChart;
