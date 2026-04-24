import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { CityTrendPoint } from '@climence/shared';

export function CityTrendChart({ data }: { data: CityTrendPoint[] }) {
  return (
    <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 p-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
        <BarChart3 className="w-4 h-4 mr-2 text-indigo-400" /> City-Wide Trend (30m)
      </h3>
      <div className="w-full h-48 -ml-5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="minute_label" stroke="#6b7280" fontSize={10} minTickGap={20} />
            <YAxis yAxisId="left" stroke="#ef4444" fontSize={10} width={40} />
            <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} width={40} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avg_pm25"
              name="PM2.5 Avg"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avg_co2"
              name="CO2 Avg"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
