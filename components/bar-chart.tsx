"use client"

import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A bar chart with a custom label"

const chartConfig = {
  desktop: {
    label: "count",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

interface BarData {
  week: number
  count: number
}

export function ChartBar() {
  const [chartData, setChartData] = useState<BarData[]>([])
  const [month, setMonth] = useState<string>("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/chart")
        const json = await res.json()
        setChartData(json.data)
        setMonth(json.month)
      } catch (e) {
        console.error("Failed to load bar chart data:", e)
      }
    }
    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Production</CardTitle>
        <CardDescription>{month}</CardDescription>
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
        <div className="flex gap-2 leading-none font-medium">
          Data for this weeks<TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total production for the last {(chartData.length ?? 0)} weeks
        </div>
      </CardFooter>
    </Card>
  )
}
