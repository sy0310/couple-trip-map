'use client';

import { useState, useRef } from 'react';
import { PROVINCES, normalizeProvinceName } from '@/lib/provinces';
import { updateTrip, uploadPhotosToTrip, deleteTrip } from '@/lib/trips';

interface EditTripFormProps {
  trip: {
    id: string;
    locationName: string;
    province: string;
    city: string;
    scenicSpot: string | null;
    visitDate: string;
    notes: string | null;
    coupleId: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditTripForm({ trip, onSuccess, onCancel }: EditTripFormProps) {
  const [province, setProvince] = useState(trip.province);
  const [city, setCity] = useState(trip.city);
  const [scenicSpot, setScenicSpot] = useState(trip.scenicSpot || '');
  const [visitDate, setVisitDate] = useState(trip.visitDate);
  const [notes, setNotes] = useState(trip.notes || '');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (files: FileList) => {
    const newFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (newFiles.length === 0) return;
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setPhotos((prev) => [...prev, ...newFiles]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!province || !city || !visitDate) {
      setStatusMsg('请填写省份、城市和日期');
      return;
    }

    setSubmitting(true);
    setStatusMsg('');

    const normalizedProvince = normalizeProvinceName(province);
    const normalizedCity = normalizeProvinceName(city);
    const locationName = scenicSpot
      ? `${normalizedProvince}·${normalizedCity}·${scenicSpot}`
      : `${normalizedProvince}·${normalizedCity}`;

    const ok = await updateTrip(trip.id, {
      location_name: locationName,
      province: normalizedProvince,
      city: normalizedCity,
      scenic_spot: scenicSpot || null,
      visit_date: visitDate,
      notes: notes || null,
    });

    if (!ok) {
      setSubmitting(false);
      setStatusMsg('保存失败，请重试');
      return;
    }

    // Upload new photos if any
    if (photos.length > 0) {
      setStatusMsg(`正在上传 ${photos.length} 张照片...`);
      await uploadPhotosToTrip(trip.id, trip.coupleId, photos, (done, total) => {
        setStatusMsg(`正在上传 ${done}/${total} 张...`);
      });
    }

    setSubmitting(false);
    setStatusMsg('✓ 已保存');
    setTimeout(() => onSuccess(), 800);
  };

  const handleDeleteTrip = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    setSubmitting(true);
    const ok = await deleteTrip(trip.id);
    if (ok) {
      setStatusMsg('✓ 已删除');
      setTimeout(() => onSuccess(), 800);
    } else {
      setSubmitting(false);
      setStatusMsg('删除失败，请重试');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Form panel */}
      <div
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          background: '#352118',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,222,165,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,222,165,0.1)' }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: '#ffdea5', fontFamily: "var(--font-newsreader)", fontStyle: 'italic' }}
          >
            编辑旅行
          </h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: '#dac2b6' }}
          >
            ✕
          </button>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-grow">
          {/* Province */}
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#dac2b6', letterSpacing: '0.1em' }}>
              省份 *
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,222,165,0.2)',
                color: '#ffdea5',
                fontFamily: "var(--font-manrope)",
              }}
            >
              <option value="" style={{ background: '#352118', color: '#ffdea5' }}>选择省份</option>
              {PROVINCES.map((p) => (
                <option key={p.name} value={p.name} style={{ background: '#352118', color: '#ffdea5' }}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#dac2b6', letterSpacing: '0.1em' }}>
              城市 *
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="例如：广州"
              className="w-full px-3 py-2.5 rounded-lg text-sm placeholder:text-white/30"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,222,165,0.2)',
                color: '#ffdea5',
                fontFamily: "var(--font-manrope)",
              }}
            />
          </div>

          {/* Scenic spot */}
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#dac2b6', letterSpacing: '0.1em' }}>
              景点（可选）
            </label>
            <input
              type="text"
              value={scenicSpot}
              onChange={(e) => setScenicSpot(e.target.value)}
              placeholder="例如：长隆欢乐世界"
              className="w-full px-3 py-2.5 rounded-lg text-sm placeholder:text-white/30"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,222,165,0.2)',
                color: '#ffdea5',
                fontFamily: "var(--font-manrope)",
              }}
            />
          </div>

          {/* Visit date */}
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#dac2b6', letterSpacing: '0.1em' }}>
              日期 *
            </label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,222,165,0.2)',
                color: '#ffdea5',
                fontFamily: "var(--font-manrope)",
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#dac2b6', letterSpacing: '0.1em' }}>
              备注（可选）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="写下这次旅行的感受..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg text-sm placeholder:text-white/30 resize-none"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,222,165,0.2)',
                color: '#ffdea5',
                fontFamily: "var(--font-manrope)",
              }}
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#dac2b6', letterSpacing: '0.1em' }}>
              添加照片
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 rounded-lg border-2 border-dashed text-sm transition-colors"
              style={{
                borderColor: 'rgba(255,222,165,0.3)',
                color: '#dac2b6',
                fontFamily: "var(--font-manrope)",
              }}
            >
              点击选择照片（PNG、JPG）
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              multiple
              onChange={(e) => e.target.files && handlePhotoSelect(e.target.files)}
              className="hidden"
            />

            {/* Photo previews */}
            {photoPreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative w-16 h-16 rounded overflow-hidden">
                    <img src={src} alt={`预览 ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                      style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status message */}
          {statusMsg && (
            <p className="text-xs" style={{ color: statusMsg.startsWith('✓') ? '#ffdea5' : '#ff9a76' }}>{statusMsg}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-lg text-sm transition-colors border"
              style={{
                borderColor: 'rgba(255,222,165,0.2)',
                color: '#dac2b6',
                fontFamily: "var(--font-manrope)",
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #c99a6c, #b8895e)',
                color: '#221a0f',
                fontFamily: "var(--font-manrope)",
              }}
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>

          {/* Delete trip */}
          <div className="pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={handleDeleteTrip}
                className="w-full py-2.5 rounded-lg text-sm transition-colors"
                style={{
                  background: 'rgba(255,99,99,0.15)',
                  color: '#ff6b6b',
                  border: '1px solid rgba(255,99,99,0.3)',
                  fontFamily: "var(--font-manrope)",
                }}
              >
                删除此旅行
              </button>
            ) : (
              <div className="p-4 rounded-lg border" style={{ background: 'rgba(255,99,99,0.1)', borderColor: 'rgba(255,99,99,0.3)' }}>
                <p className="text-sm mb-3" style={{ color: '#ff9a76' }}>确定要删除这段旅行吗？所有照片也会被一并删除，此操作不可撤销。</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 rounded-lg text-sm border"
                    style={{ borderColor: 'rgba(255,222,165,0.2)', color: '#dac2b6', fontFamily: "var(--font-manrope)" }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteTrip}
                    disabled={submitting}
                    className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ background: '#ff6b6b', color: '#fff', fontFamily: "var(--font-manrope)" }}
                  >
                    {submitting ? '删除中...' : '确认删除'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
