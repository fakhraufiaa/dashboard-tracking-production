"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "./auth-provider";
import { format } from "date-fns";

export const description = "A bar chart with a custom label";

const chartConfig = {
  desktop: {
    label: "count",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig;

interface BarData {
  week: number;
  count: number;
}


export function ChartBar() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<BarData[]>([]);
  const [month, setMonth] = useState<string>("2025-10"); // default bulan
  const [monthLabel, setMonthLabel] = useState<string>(); // nama bulan (Oktober, September, dst.)
  const [months, setMonths] = useState<string[]>([]); // dari

  const fetchData = async (selectedMonth: string) => {
    try {
      const res = await fetch(`/api/chart?month=${selectedMonth}`);
      const json = await res.json();
      setChartData(json.data);
      setMonthLabel(json.month); // nama bulan dari backend
    } catch (e) {
      console.error("Failed to load bar chart data:", e);
    }
  };

  useEffect(() => {
    // Ambil daftar bulan dari API
    fetch("/api/chart/month")
      .then((res) => res.json())
      .then((data) => {
        setMonths(data.data);
        const current = format(new Date(), "yyyy-MM");
        if (data.data.includes(current)) {
          setMonth(current);
          fetchData(current);
        } else {
          // fallback ke bulan terakhir di list
          const lastMonth = data.data[data.data.length - 1];
          setMonth(lastMonth);
          fetchData(lastMonth);
        }
      });
  }, []);


  useEffect(() => {
    if (month) {
      fetchData(month);
    }
  }, [month]);


  return (
    <Card>
      <CardHeader>
  <CardTitle>Bar Chart - Production</CardTitle>
  <CardDescription>
    {(user?.role as string) === "ADMIN" && (
      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
    <span className="ml-2 text-muted-foreground">{monthLabel}</span>
  </CardDescription>
</CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="week"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => `Week ${value}`}
              hide
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="count"
              layout="vertical"
              fill="var(--color-desktop)"
              radius={4}
            >
              <LabelList
                dataKey="week"
                position="insideLeft"
                offset={8}
                className="fill-(--color-label)"
                fontSize={12}
              />
              <LabelList
                dataKey="count"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {(() => {
          const totalCount = chartData.reduce((sum, d) => sum + d.count, 0);
          if (totalCount === 0) {
            return (
              <div className="flex gap-2 leading-none font-medium">
                Data for {monthLabel} is not available yet.
              </div>
            );
          }
          return (
            <div className="flex gap-2 leading-none font-medium">
              Data for {monthLabel} {totalCount} units produced.
            </div>
          );
        })()}
        <div className="text-muted-foreground leading-none">
          Showing total production for {chartData.length ?? 0} weeks
        </div>
      </CardFooter>
    </Card>
  );
}
