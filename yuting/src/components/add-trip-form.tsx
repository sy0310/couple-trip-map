'use client';

import { useState, useRef } from 'react';
import { PROVINCES } from '@/lib/provinces';
import { createTrip, uploadPhoto, createPhotoRecord } from '@/lib/trips';

interface AddTripFormProps {
  coupleId: string;
  defaultProvince?: string;
  defaultCity?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddTripForm({
  coupleId,
  defaultProvince = '',
  defaultCity = '',
  onSuccess,
  onCancel,
}: AddTripFormProps) {
  const [province, setProvince] = useState(defaultProvince);
  const [city, setCity] = useState(defaultCity);
  const [scenicSpot, setScenicSpot] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
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
      setError('请填写省份、城市和日期');
      return;
    }

    setSubmitting(true);
    setError('');

    // Step 1: Create trip
    const trip = await createTrip(coupleId, {
      location_name: scenicSpot ? `${province}·${city}·${scenicSpot}` : `${province}·${city}`,
      province,
      city,
      scenic_spot: scenicSpot || undefined,
      visit_date: visitDate,
      notes: notes || undefined,
    });

    if (!trip) {
      setSubmitting(false);
      setError('保存失败，请重试');
      return;
    }

    // Step 2: Upload photos if any
    if (photos.length > 0) {
      setUploadProgress(`正在上传 ${photos.length} 张照片...`);
      let uploadedCount = 0;

      for (const photo of photos) {
        const url = await uploadPhoto(coupleId, photo);
        if (url) {
          await createPhotoRecord(trip.id, url);
        }
        uploadedCount++;
        setUploadProgress(`正在上传 ${uploadedCount}/${photos.length} 张...`);
      }
    }

    setSubmitting(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
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
            记录新旅行
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
              placeholder="例如：广州市"
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
              照片（可选）
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

          {/* Upload progress */}
          {uploadProgress && (
            <p className="text-xs" style={{ color: '#ffdea5' }}>{uploadProgress}</p>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs" style={{ color: '#ff9a76' }}>{error}</p>
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
                background: 'linear-gradient(135deg, #563a31, #705147)',
                color: '#ffffff',
                boxShadow: 'inset 0 1px 0 rgba(255,222,165,0.4), 0 2px 4px rgba(0,0,0,0.3)',
                fontFamily: "var(--font-manrope)",
              }}
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
