"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  denganAfiliasi: {
    label: "Dengan Afiliasi",
    color: "#2C1F63", // Purple
  },
  tanpaAfiliasi: {
    label: "Tanpa Afiliasi",
    color: "#FF8C00", // Orange
  },
} satisfies ChartConfig

type ChartLineDotsCustomProps = {
  data: { date: string; denganAfiliasi: number; tanpaAfiliasi: number }[];
};

export function ChartLineDotsCustom({ data }: ChartLineDotsCustomProps) {
  return (
    <Card className="border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row justify-between items-center pb-4 border-b border-gray-100">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-extrabold text-black uppercase tracking-wide">
            Perbandingan Transaksi
          </CardTitle>
          <CardDescription className="text-xs text-gray-500 font-bold">
            Tren Transaksi Harian (30 Hari Terakhir)
          </CardDescription>
        </div>
        <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold shadow-sm">
          Harian
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="w-full h-[220px]">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
              top: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="font-bold text-gray-400 text-[10px]"
            />
            <ChartTooltip
              cursor={{ stroke: "#000", strokeWidth: 1, strokeDasharray: "4 4" }}
              content={<ChartTooltipContent />}
            />
            <Line
              dataKey="denganAfiliasi"
              type="monotone"
              stroke="#2C1F63"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#2C1F63" }}
              activeDot={{ r: 6 }}
            />
            <Line
              dataKey="tanpaAfiliasi"
              type="monotone"
              stroke="#FF8C00"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#FF8C00" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
