"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
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

type ChartPieDonutTextProps = {
  denganAfiliasiCount: number;
  tanpaAfiliasiCount: number;
};

export function ChartPieDonutText({ denganAfiliasiCount, tanpaAfiliasiCount }: ChartPieDonutTextProps) {
  const totalTransactions = denganAfiliasiCount + tanpaAfiliasiCount;

  const chartData = [
    { type: "denganAfiliasi", value: denganAfiliasiCount, fill: "#2C1F63" },
    { type: "tanpaAfiliasi", value: tanpaAfiliasiCount, fill: "#FF8C00" },
  ];

  const denganAfiliasiPercent = totalTransactions > 0 ? ((denganAfiliasiCount / totalTransactions) * 100).toFixed(1) : "0.0";
  const tanpaAfiliasiPercent = totalTransactions > 0 ? ((tanpaAfiliasiCount / totalTransactions) * 100).toFixed(1) : "0.0";

  return (
    <Card className="border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="pb-4 border-b border-gray-100">
        <CardTitle className="text-base font-extrabold text-black uppercase tracking-wide">
          Komposisi Transaksi
        </CardTitle>
        <CardDescription className="text-xs text-gray-500 font-bold">
          Pembagian Jenis Penjualan Tiket
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col sm:flex-row items-center justify-center p-6 gap-6">
        <ChartContainer
          config={chartConfig}
          className="mx-auto w-[160px] h-[160px]"
        >
          <PieChart width={160} height={160}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="type"
              innerRadius={50}
              outerRadius={75}
              strokeWidth={3}
              stroke="#fff"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <g>
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy - 5}
                          className="fill-black text-2xl font-extrabold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {totalTransactions.toLocaleString()}
                        </text>
                        <text
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 18}
                          className="fill-gray-400 font-bold text-[10px] uppercase tracking-wider"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          Total
                        </text>
                      </g>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Custom Legend */}
        <div className="flex flex-col gap-4 w-full sm:w-auto min-w-[150px] font-semibold text-xs text-gray-700">
          <div className="flex items-start gap-3">
            <span className="h-3 w-3 rounded bg-[#2C1F63] border border-black/20 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="font-extrabold text-black">Dengan Afiliasi</span>
              <span className="text-[11px] text-gray-400 font-bold">
                {denganAfiliasiCount.toLocaleString()} ({denganAfiliasiPercent}%)
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="h-3 w-3 rounded bg-[#FF8C00] border border-black/20 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="font-extrabold text-black">Tanpa Afiliasi</span>
              <span className="text-[11px] text-gray-400 font-bold">
                {tanpaAfiliasiCount.toLocaleString()} ({tanpaAfiliasiPercent}%)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
