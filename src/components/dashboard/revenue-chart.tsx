
'use client';

import * as React from 'react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

interface RevenueChartProps {
    totalRevenue: number;
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

export function RevenueChart({ totalRevenue }: RevenueChartProps) {
    const data = React.useMemo(() => {
        if (totalRevenue === 0) {
            return months.map(month => ({ month, revenue: 0 }));
        }

        let runningTotal = 0;
        const randomPoints = Array.from({ length: months.length }, () => Math.random());
        const totalRandom = randomPoints.reduce((acc, val) => acc + val, 0);

        return months.map((month, index) => {
            const monthShare = (randomPoints[index] / totalRandom);
            runningTotal += monthShare * totalRevenue;
            return { month, revenue: Math.round(runningTotal) };
        });
    }, [totalRevenue]);
    
  return (
    <ChartContainer config={chartConfig} className=" w-full">
      <LineChart 
        data={data}
        margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
        }}
    >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
        <XAxis
          dataKey="month"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value / 1000}k`}
        />
        <Tooltip
          cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '3 3' }}
          content={<ChartTooltipContent 
            formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value as number)}
          />}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{
            r: 4,
            fill: "hsl(var(--primary))",
            stroke: "hsl(var(--background))",
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ChartContainer>
  );
}
