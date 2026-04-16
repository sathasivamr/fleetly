import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
export default function FleetStatusChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No report data for this period
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--card))',
              fontSize: 12,
            }}
            cursor={{ fill: 'hsl(var(--accent))' }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          <Bar dataKey="active" name="Active" stackId="s" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="idle" name="Idle" stackId="s" fill="hsl(var(--warning))" />
          <Bar dataKey="stopped" name="Stopped" stackId="s" fill="hsl(var(--muted-foreground))" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
