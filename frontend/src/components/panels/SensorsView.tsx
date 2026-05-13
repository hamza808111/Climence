import { Activity, Battery, CloudRain, Cpu, Radio, Thermometer } from 'lucide-react';
import type { DashboardData } from '../../hooks/useDashboardData';
import { aqiBandFor, pm25ToAqi } from '@climence/shared';
import { formatNumber } from '../../lib/i18n';

export function SensorsView({ data: d }: { data: DashboardData }) {
  return (
    <div className="cc-theme min-h-screen bg-[var(--cc-bg)] text-[var(--cc-text)] p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-8 shadow-sm">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--cc-teal)] opacity-[0.03] blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(3,218,197,0.1)] text-[var(--cc-teal)] text-xs font-semibold tracking-wide uppercase mb-4">
                <Radio size={12} className="animate-pulse" /> {d.t('sensors.gridNetwork')}
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--cc-text)]">{d.t('sensors.title')}</h1>
              <p className="text-[var(--cc-muted)] text-base max-w-xl">{d.t('sensors.subtitle')}</p>
            </div>
            
            <div className="flex gap-4">
              <div className="flex flex-col items-end">
                <span className="text-4xl font-light tracking-tighter text-[var(--cc-text)]">{d.sensors.length}</span>
                <span className="text-sm font-medium text-[var(--cc-muted)] uppercase tracking-wider">{d.t('sensors.totalUnits')}</span>
              </div>
              <div className="w-px bg-[var(--cc-border)] self-stretch mx-2" />
              <div className="flex flex-col items-end">
                <span className="text-4xl font-light tracking-tighter text-[var(--cc-teal)]">{d.onlineSensors}</span>
                <span className="text-sm font-medium text-[var(--cc-teal)] uppercase tracking-wider">{d.t('sensors.online')}</span>
              </div>
              {d.sensors.length - d.onlineSensors > 0 && (
                <>
                  <div className="w-px bg-[var(--cc-border)] self-stretch mx-2" />
                  <div className="flex flex-col items-end">
                    <span className="text-4xl font-light tracking-tighter text-[var(--cc-hazard)]">{d.sensors.length - d.onlineSensors}</span>
                    <span className="text-sm font-medium text-[var(--cc-hazard)] uppercase tracking-wider">{d.t('sensors.offline')}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {d.sensors.map((sensor, i) => {
            const isOffline = sensor.status === 'offline';
            const aqiBand = aqiBandFor(sensor.aqi || pm25ToAqi(sensor.pm25));
            
            return (
              <div 
                key={sensor.uuid} 
                className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 ${isOffline ? 'bg-[var(--cc-bg)] border-[var(--cc-border)] opacity-60' : 'bg-[var(--cc-surface)] border-[var(--cc-border)] hover:border-[var(--cc-teal)]'}`}
                style={{ animationDelay: `${(i % 10) * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--cc-text)] flex items-center gap-2">
                      <Cpu size={18} className={isOffline ? 'text-[var(--cc-muted)]' : 'text-[var(--cc-teal)]'} />
                      {sensor.label || `${d.t('nav.sensors')} ${sensor.uuid.slice(0, 8)}`}
                    </h3>
                    <p className="text-xs text-[var(--cc-muted)] font-mono mt-1">{sensor.lat.toFixed(4)}, {sensor.lng.toFixed(4)}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    isOffline 
                      ? 'bg-transparent text-[var(--cc-muted)] border-[var(--cc-border)]' 
                      : 'bg-[rgba(3,218,197,0.1)] text-[var(--cc-teal)] border-[rgba(3,218,197,0.2)]'
                  }`}>
                    {isOffline ? d.t('sensors.offline') : d.t('sensors.online')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--cc-muted)] flex items-center gap-1"><Activity size={12} /> {d.t('sensors.pm25')}</span>
                    <span className="text-xl font-medium tnum flex items-baseline gap-1">
                      {isOffline ? '--' : formatNumber(Math.round(sensor.pm25), d.locale)}
                      <span className="text-xs text-[var(--cc-muted)]">µg/m³</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--cc-muted)] flex items-center gap-1"><CloudRain size={12} /> {d.t('sensors.no2')}</span>
                    <span className="text-xl font-medium tnum flex items-baseline gap-1">
                      {isOffline ? '--' : formatNumber(Math.round(sensor.no2), d.locale)}
                      <span className="text-xs text-[var(--cc-muted)]">ppb</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--cc-muted)] flex items-center gap-1"><Thermometer size={12} /> {d.t('sensors.temp')}</span>
                    <span className="text-xl font-medium tnum flex items-baseline gap-1">
                      {isOffline ? '--' : formatNumber(Math.round(sensor.temperature), d.locale)}
                      <span className="text-xs text-[var(--cc-muted)]">°C</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--cc-muted)] flex items-center gap-1"><Battery size={12} /> {d.t('sensors.battery')}</span>
                    <span className={`text-xl font-medium tnum flex items-baseline gap-1 ${!isOffline && sensor.battery < 20 ? 'text-[var(--cc-hazard)]' : ''}`}>
                      {isOffline ? '--' : formatNumber(Math.round(sensor.battery), d.locale)}
                      <span className="text-xs text-[var(--cc-muted)]">%</span>
                    </span>
                  </div>
                </div>

                {!isOffline && (
                  <div className="mt-6 pt-4 border-t border-[var(--cc-border)] flex items-center justify-between">
                    <span className="text-sm text-[var(--cc-muted)]">{d.t('sensors.currentAqi')}</span>
                    <span className="text-sm font-bold" style={{ color: aqiBand.key === 'good' ? 'var(--cc-teal)' : aqiBand.key === 'mod' || aqiBand.key === 'usg' ? 'var(--cc-warn)' : 'var(--cc-hazard)' }}>
                      {formatNumber(Math.round(sensor.aqi || pm25ToAqi(sensor.pm25)), d.locale)} · {aqiBand.label}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
