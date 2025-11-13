
'use client';

import * as React from 'react';
import { Pie, PieChart, ResponsiveContainer, Legend, Cell } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';

interface ExpenseChartProps {
  totalExpenses: number;
}

const expenseCategories = [
  { category: 'Software', value: 0.25, color: 'hsl(var(--chart-1))' },
  { category: 'Office Supplies', value: 0.20, color: 'hsl(var(--chart-2))' },
  { category: 'Utilities', value: 0.15, color: 'hsl(var(--chart-3))' },
  { category: 'Marketing', value: 0.10, color: 'hsl(var(--chart-4))' },
  { category: 'Other', value: 0.30, color: 'hsl(var(--chart-5))' },
];

const chartConfig = {
  value: {
    label: 'Value',
  },
  software: {
    label: 'Software',
    color: 'hsl(var(--chart-1))',
  },
  officesupplies: {
    label: 'Office Supplies',
    color: 'hsl(var(--chart-2))',
  },
  utilities: {
    label: 'Utilities',
    color: 'hsl(var(--chart-3))',
  },
  marketing: {
    label: 'Marketing',
    color: 'hsl(var(--chart-4))',
  },
  other: {
    label: 'Other',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;


export function ExpenseChart({ totalExpenses }: ExpenseChartProps) {
  const data = React.useMemo(() => {
    if (totalExpenses === 0) {
      return expenseCategories.map(cat => ({ ...cat, value: 0 }));
    }
    return expenseCategories.map(cat => ({
      ...cat,
      value: Math.round(totalExpenses * cat.value)
    }));
  }, [totalExpenses]);
  
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="category"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            cx="50%"
            cy="50%"
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.category}`} fill={entry.color} stroke={entry.color} />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{
              right: 0,
              paddingLeft: '20px',
              lineHeight: '24px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
