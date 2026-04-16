import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
export default function FuelCostChart({ data = [], valueLabel = 'Fuel (L)' }) {
  if (!data.length) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No fuel data for this period
      </div>
    );
  }
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--card))',
              fontSize: 12,
            }}
          />
          <Line
            name={valueLabel}
            type="monotone"
            dataKey="cost"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 2, fill: 'hsl(var(--card))' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
