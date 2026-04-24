import { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { X } from 'lucide-react';
import type { TelemetryRecord } from '@climence/shared';
import { fetchHistory } from '../../api/client';

interface HistoryRow extends TelemetryRecord {
  displayTime: string;
}

export function DroneDiagnostics({ droneId, onClose }: { droneId: string; onClose: () => void }) {
  const [history, setHistory] = useState<HistoryRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchHistory(droneId)
      .then(rows => {
        if (cancelled) return;
        setHistory(
          rows.map(d => ({
            ...d,
            displayTime: new Date(d.server_timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [droneId]);

  return (
    <div className="absolute top-6 right-6 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-4 rounded-2xl z-[400] shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Device Diagnostics</h3>
          <div className="text-[10px] font-mono text-gray-400">ID: {droneId}</div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {history.length > 0 ? (
        <div className="w-full h-32 -ml-2 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <XAxis dataKey="displayTime" hide />
              <YAxis yAxisId="left" hide />
              <YAxis yAxisId="right" orientation="right" hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  borderColor: '#374151',
                  borderRadius: '0.5rem',
                  fontSize: '10px',
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="pm25"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-center text-[10px] text-gray-500 uppercase mt-2 font-bold tracking-widest">
            PM2.5 Trajectory
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-gray-500">No data available.</div>
      )}
    </div>
  );
}
