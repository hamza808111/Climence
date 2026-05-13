import { useEffect, useState } from 'react';
import { Calendar, Download, FileText, Sparkles, X } from 'lucide-react';
import {
  exportSnapshotCsv,
  exportSnapshotJson,
  exportSnapshotXlsx,
  loadScheduledReports,
  nextRunIso,
  openPrintablePdf,
  saveScheduledReports,
  type ReportPayload,
  type ScheduledReport,
} from '../lib/reports';
import { describeScheduleCountdown } from '../lib/schedule-runner';
import { formatDateTime, tFormat, translate, type Locale } from '../lib/i18n';

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
  const [now, setNow] = useState(() => new Date());

  const t = (key: Parameters<typeof translate>[0]) => translate(key, locale);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, [open]);

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
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title" onClick={event => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">{t('report.subtitleTag')}</div>
            <h3 id="report-modal-title">{t('report.title')}</h3>
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
                <div className="format-desc">{t('report.desc.pdf')}</div>
              </div>
              <Download size={14} className="format-cta" />
            </button>
            <button className="format-card" onClick={() => exportSnapshotCsv(payload)}>
              <div className="format-icon"><Download size={18} /></div>
              <div>
                <div className="format-name">{t('report.csv')}</div>
                <div className="format-desc">{t('report.desc.csv')}</div>
              </div>
              <Download size={14} className="format-cta" />
            </button>
            <button className="format-card" onClick={() => exportSnapshotJson(payload)}>
              <div className="format-icon"><FileText size={18} /></div>
              <div>
                <div className="format-name">{t('report.json')}</div>
                <div className="format-desc">{t('report.desc.json')}</div>
              </div>
              <Download size={14} className="format-cta" />
            </button>
            <button className="format-card" onClick={() => exportSnapshotXlsx(payload)}>
              <div className="format-icon"><FileText size={18} /></div>
              <div>
                <div className="format-name">{t('report.xlsx')}</div>
                <div className="format-desc">{t('report.desc.xlsx')}</div>
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
                {(['pdf', 'csv', 'json', 'xlsx'] as const).map(value => (
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
                        {t('report.nextRun')} · {formatDateTime(item.nextRun, locale)}
                      </div>
                      <div className="sched-next">
                        {(() => {
                          const countdown = describeScheduleCountdown(item.nextRun, now);
                          if (countdown.bucket === 'now') return t('report.countdown.now');
                          return tFormat(`report.countdown.${countdown.bucket}` as const, locale, { value: countdown.value ?? 0 });
                        })()}
                      </div>
                    </div>
                    <button className="icon-btn" onClick={() => handleRemoveSchedule(item.id)} aria-label={t('report.removeSchedule')}>
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
