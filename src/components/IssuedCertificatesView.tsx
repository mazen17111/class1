import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  Download,
  Eye,
  Printer,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  X,
  Palette,
  Trash2,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { IssuedCertificate, Student } from '../types';
import { ARABIC_LETTERS } from '../data/arabicData';
import { ChildCertificate, CERTIFICATE_THEMES } from './ChildCertificate';
import { sound } from '../utils/audio';

interface IssuedCertificatesViewProps {
  certificates: IssuedCertificate[];
  onUpdateCertificateTheme: (certId: string, themeId: string) => void;
  onDeleteCertificate: (certId: string) => Promise<void> | void;
  onBack: () => void;
}

export const IssuedCertificatesView: React.FC<IssuedCertificatesViewProps> = ({
  certificates,
  onUpdateCertificateTheme,
  onDeleteCertificate,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [letterFilter, setLetterFilter] = useState<string>('all');
  const [selectedCert, setSelectedCert] = useState<IssuedCertificate | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const previewCertRef = useRef<HTMLDivElement>(null);

  const handleConfirmDelete = async (certId: string) => {
    sound.playClick();
    setDeletingId(certId);
    try {
      await onDeleteCertificate(certId);
      if (selectedCert?.id === certId) {
        setSelectedCert(null);
      }
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCerts = useMemo(() => {
    return certificates.filter((c) => {
      const matchesName =
        !searchTerm.trim() ||
        c.studentName.toLowerCase().includes(searchTerm.trim().toLowerCase());
      const matchesLetter =
        letterFilter === 'all' || c.letterChar === letterFilter || c.letterId === letterFilter;
      return matchesName && matchesLetter;
    });
  }, [certificates, searchTerm, letterFilter]);

  const activeSelectedCert = useMemo(() => {
    if (!selectedCert) return null;
    return certificates.find((c) => c.id === selectedCert.id) || selectedCert;
  }, [certificates, selectedCert]);

  const averagePercentage = useMemo(() => {
    if (certificates.length === 0) return 0;
    const sum = certificates.reduce((acc, c) => acc + c.percentage, 0);
    return Math.round(sum / certificates.length);
  }, [certificates]);

  const handleDownloadPreview = async () => {
    if (!previewCertRef.current || !activeSelectedCert) return;
    setIsDownloading(true);
    sound.playClick();

    try {
      const dataUrl = await toPng(previewCertRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `شهادة_${activeSelectedCert.studentName.replace(/\s+/g, '_')}_حرف_${activeSelectedCert.letterChar}.png`;
      link.href = dataUrl;
      link.click();
      sound.playSuccess();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to export certificate image:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            id="btn-certs-back"
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-black text-sm border border-slate-200 shadow-xs active:scale-95 transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمنصة</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                سجل الشهادات الصادرة
              </h2>
              <p className="text-xs sm:text-sm font-bold text-orange-600">
                توثيق إنجازات أبطال الصف الأول · بإشراف المعلم وائل حمدي
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-2xl border border-amber-200 shadow-xs text-center">
            <span className="text-[11px] font-bold text-slate-500 block">إجمالي الشهادات</span>
            <span className="text-lg font-black text-amber-600">{certificates.length}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl border border-emerald-200 shadow-xs text-center">
            <span className="text-[11px] font-bold text-slate-500 block">متوسط الإتقان</span>
            <span className="text-lg font-black text-emerald-600">{averagePercentage}%</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم الطالب..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white focus:outline-hidden text-sm font-bold text-slate-800"
          />
        </div>

        <select
          value={letterFilter}
          onChange={(e) => setLetterFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 text-sm font-bold text-slate-800"
        >
          <option value="all">جميع الحروف ({certificates.length})</option>
          {ARABIC_LETTERS.map((l) => (
            <option key={l.id} value={l.char}>
              حرف {l.char} - {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Certificates Grid */}
      {filteredCerts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-slate-200 text-center">
          <Award className="w-16 h-16 mx-auto mb-3 text-amber-300" />
          <h3 className="text-xl font-black text-slate-800 mb-1">
            {certificates.length === 0
              ? 'لا توجد شهادات صادرة بعد'
              : 'لا توجد شهادات مطابقة للبحث'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {certificates.length === 0
              ? 'بمجرد إنهاء أي طالب لنشاط الحروف، يتم إصدار وحفظ شهادته هنا تلقائياً لتتمكن من عرضها وتحميلها في أي وقت.'
              : 'جرب تغيير اسم الطالب أو اختيار حرف آخر.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCerts.map((cert) => {
            const theme =
              CERTIFICATE_THEMES.find((t) => t.id === cert.themeId) || CERTIFICATE_THEMES[0];
            return (
              <div
                key={cert.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Theme color accent bar */}
                <div className="h-2 w-full" style={{ backgroundColor: theme.colorHex }} />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-xs"
                        style={{ backgroundColor: cert.studentAvatarColor || theme.colorHex }}
                      >
                        {cert.studentName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900 text-base truncate">
                          {cert.studentName}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {cert.issuedDateLabel}
                        </span>
                      </div>
                    </div>

                    <div
                      className="px-2.5 py-1 rounded-xl text-sm font-black shrink-0 border"
                      style={{
                        borderColor: `${theme.colorHex}55`,
                        color: theme.colorHex,
                        backgroundColor: `${theme.colorHex}12`,
                      }}
                    >
                      ({cert.letterChar})
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100 mb-4">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block">الدرجة</span>
                      <span className="text-sm font-black text-slate-800">
                        {cert.score} / {cert.total}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block">نسبة الإتقان</span>
                      <span className="text-sm font-black text-emerald-600">
                        {cert.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setSelectedCert(cert);
                        setConfirmDeleteId(null);
                        setDownloadSuccess(false);
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>عرض وتحميل الشهادة</span>
                    </button>

                    {confirmDeleteId === cert.id ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          id={`btn-confirm-delete-cert-${cert.id}`}
                          type="button"
                          disabled={deletingId === cert.id}
                          onClick={() => handleConfirmDelete(cert.id)}
                          className="px-2.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-black text-xs transition-colors"
                        >
                          {deletingId === cert.id ? '...' : 'تأكيد'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`btn-delete-cert-${cert.id}`}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setConfirmDeleteId(cert.id);
                        }}
                        title="حذف الشهادة من الشهادات المحفوظة"
                        className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 active:scale-95 transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Certificate Preview Modal */}
      {activeSelectedCert && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setSelectedCert(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-slate-900">
                  شهادة البطل: {activeSelectedCert.studentName}
                </h3>
              </div>

              <button
                onClick={() => setSelectedCert(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Theme Color Switcher */}
            <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
              <span className="text-xs font-black text-slate-600 flex items-center gap-1 ml-1">
                <Palette className="w-4 h-4 text-orange-500" />
                تغيير اللون:
              </span>
              {CERTIFICATE_THEMES.map((th) => {
                const isActive = th.id === activeSelectedCert.themeId;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      sound.playClick();
                      onUpdateCertificateTheme(activeSelectedCert.id, th.id);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm ring-2 ring-orange-400'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/15"
                      style={{ backgroundColor: th.colorHex }}
                    />
                    <span>{th.colorName}</span>
                  </button>
                );
              })}
            </div>

            {/* Landscape Certificate */}
            <div className="overflow-x-auto pb-2 mb-5">
              <ChildCertificate
                student={
                  {
                    id: activeSelectedCert.studentId,
                    name: activeSelectedCert.studentName,
                    avatarColor: activeSelectedCert.studentAvatarColor,
                  } as Student
                }
                letter={
                  ARABIC_LETTERS.find((l) => l.id === activeSelectedCert.letterId) || {
                    id: activeSelectedCert.letterId,
                    char: activeSelectedCert.letterChar,
                    name: activeSelectedCert.letterName,
                    forms: {
                      isolated: activeSelectedCert.letterChar,
                      beginning: activeSelectedCert.letterChar,
                      middle: activeSelectedCert.letterChar,
                      end: activeSelectedCert.letterChar,
                    },
                    shortSounds: {
                      fatha: activeSelectedCert.letterChar,
                      damma: activeSelectedCert.letterChar,
                      kasra: activeSelectedCert.letterChar,
                    },
                    longSounds: {
                      alif: activeSelectedCert.letterChar,
                      waw: activeSelectedCert.letterChar,
                      yaa: activeSelectedCert.letterChar,
                    },
                  }
                }
                score={activeSelectedCert.score}
                total={activeSelectedCert.total}
                percentage={activeSelectedCert.percentage}
                theme={
                  CERTIFICATE_THEMES.find((t) => t.id === activeSelectedCert.themeId) ||
                  CERTIFICATE_THEMES[0]
                }
                issuedDate={activeSelectedCert.issuedDateLabel}
                certificateRef={previewCertRef}
              />
            </div>

            {/* Download & Print Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleDownloadPreview}
                disabled={isDownloading}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تم تحميل الشهادة!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>{isDownloading ? 'جاري التجهيز...' : 'تحميل الشهادة صورة (PNG)'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  window.print();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Printer className="w-5 h-5 text-amber-700" />
                <span>طباعة الشهادة</span>
              </button>

              {confirmDeleteId === activeSelectedCert.id ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={deletingId === activeSelectedCert.id}
                    onClick={() => handleConfirmDelete(activeSelectedCert.id)}
                    className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-md transition-all"
                  >
                    {deletingId === activeSelectedCert.id ? 'جاري الحذف...' : 'تأكيد حذف الشهادة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setConfirmDeleteId(activeSelectedCert.id);
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف الشهادة</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
