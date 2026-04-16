import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
export default function UtilizationChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No utilization data yet
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="util" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} domain={[50, 100]} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--card))',
              fontSize: 12,
            }}
          />
          <ReferenceLine y={75} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="utilization"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="url(#util)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
