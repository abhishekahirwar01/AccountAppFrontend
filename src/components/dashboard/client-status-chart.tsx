
'use client';

import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';

interface ClientStatusChartProps {
  active: number;
  inactive: number;
}

const chartConfig = {
  count: {
    label: 'Count',
  },
  active: {
    label: 'Active',
    color: 'hsl(var(--chart-1))',
  },
  inactive: {
    label: 'Inactive',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig;

export function ClientStatusChart({ active, inactive }: ClientStatusChartProps) {
  const data = [
    { status: 'Active', count: active, fill: 'hsl(var(--chart-1))' },
    { status: 'Inactive', count: inactive, fill: 'hsl(var(--muted-foreground))' },
  ];

  return (
    <div className="flex flex-col items-center h-full">
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={60}
                    outerRadius={80}
                    strokeWidth={5}
                    paddingAngle={-5}
                    startAngle={90}
                    endAngle={450}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground -mt-4">
        <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartConfig.active.color }} />
            <span>Active: {active}</span>
        </div>
        <div className="flex items-center gap-2">
             <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartConfig.inactive.color }} />
            <span>Inactive: {inactive}</span>
        </div>
      </div>
    </div>
  );
}
