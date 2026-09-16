'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import type { WorkloadPoint } from '@/services/workload.service';

export function WorkloadChart({ data }: { data: WorkloadPoint[] }) {
  const chartData = data.map((d) => ({
    date: new Date(d.training_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
    ACWR: d.acwr,
    Carico: d.session_load,
  }));

  return (
    <div className="h-64 w-full rounded-xl border bg-card p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip />
          <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 4" label="Rischio" />
          <ReferenceLine y={0.8} stroke="#eab308" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="ACWR" stroke="#6366f1" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
