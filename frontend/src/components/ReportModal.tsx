import { useState } from 'react';
import { Calendar, Download, FileText, Sparkles, X } from 'lucide-react';
import {
  exportSnapshotCsv,
  exportSnapshotJson,
  loadScheduledReports,
  nextRunIso,
  openPrintablePdf,
  saveScheduledReports,
  type ReportPayload,
  type ScheduledReport,
} from '../lib/reports';
import { translate, type Locale } from '../lib/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  payload: ReportPayload;
  locale: Locale;
}

export function ReportModal({ open, onClose, payload, locale }: Props) {
  const [schedules, setSchedules] = useState<ScheduledReport[]>(() => loadScheduledReports());
  const [cadence, setCadence] = useState<ScheduledReport['cadence']>('daily');
  const [format, setFormat] = useState<ScheduledReport['format']>('pdf');

  const t = (key: Parameters<typeof translate>[0]) => translate(key, locale);

  if (!open) return null;

  const handleAddSchedule = () => {
    const next: ScheduledReport = {
      id: `sch-${Date.now()}`,
      label: `${cadence} ${format.toUpperCase()} snapshot`,
      cadence,
      nextRun: nextRunIso(cadence),
      format,
    };
    const merged = [next, ...schedules].slice(0, 8);
    setSchedules(merged);
    saveScheduledReports(merged);
  };

  const handleRemoveSchedule = (id: string) => {
    const filtered = schedules.filter(item => item.id !== id);
    setSchedules(filtered);
    saveScheduledReports(filtered);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={event => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">FR-15 · FR-16 · UC-A5</div>
            <h3>{t('report.title')}</h3>
            <p className="modal-sub">{t('report.subtitle')}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label={t('report.close')}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <button className="format-card" onClick={() => openPrintablePdf(payload)}>
              <div className="format-icon"><FileText size={18} /></div>
              <div>
                <div className="format-name">{t('report.pdf')}</div>
                <div className="format-desc">Opens in a new tab, ready to print / save as PDF.</div>
              </div>
              <Download size={14} className="format-cta" />
            </button>
            <button className="format-card" onClick={() => exportSnapshotCsv(payload)}>
              <div className="format-icon"><Download size={18} /></div>
              <div>
                <div className="format-name">{t('report.csv')}</div>
                <div className="format-desc">Sensors, alerts, hotspots, city trend — one workbook-friendly file.</div>
              </div>
              <Download size={14} className="format-cta" />
            </button>
            <button className="format-card" onClick={() => exportSnapshotJson(payload)}>
              <div className="format-icon"><FileText size={18} /></div>
              <div>
                <div className="format-name">{t('report.json')}</div>
                <div className="format-desc">Full structured snapshot + derived metrics for integrations.</div>
              </div>
              <Download size={14} className="format-cta" />
            </button>
          </div>

          <div className="modal-section">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              <Sparkles size={11} style={{ marginRight: 6 }} />
              {t('report.schedule')}
            </div>
            <div className="sched-row">
              <div className="seg">
                {(['daily', 'weekly', 'monthly'] as const).map(value => (
                  <button
                    key={value}
                    className={`seg-btn ${cadence === value ? 'active' : ''}`}
                    onClick={() => setCadence(value)}
                  >
                    {t(`report.cadence.${value}` as const)}
                  </button>
                ))}
              </div>
              <div className="seg">
                {(['pdf', 'csv', 'json'] as const).map(value => (
                  <button
                    key={value}
                    className={`seg-btn ${format === value ? 'active' : ''}`}
                    onClick={() => setFormat(value)}
                  >
                    {value.toUpperCase()}
                  </button>
                ))}
              </div>
              <button className="btn primary" onClick={handleAddSchedule}>
                <Calendar size={13} />
                {t('report.addSchedule')}
              </button>
            </div>
          </div>

          <div className="modal-section">
            <div className="eyebrow" style={{ marginBottom: 8 }}>{t('report.existing')}</div>
            {schedules.length === 0 ? (
              <div className="empty-note">{t('report.noneScheduled')}</div>
            ) : (
              <ul className="sched-list">
                {schedules.map(item => (
                  <li key={item.id} className="sched-item">
                    <div>
                      <div className="sched-label">{item.label}</div>
                      <div className="sched-next">
                        {t('report.nextRun')} · {new Date(item.nextRun).toLocaleString()}
                      </div>
                    </div>
                    <button className="icon-btn" onClick={() => handleRemoveSchedule(item.id)} aria-label="Remove schedule">
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
