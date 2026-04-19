'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { RoomPanel } from '@/components/furniture';
import { getCoupleId, getVisitedCities } from '@/lib/trips';
import { AddTripForm } from '@/components/add-trip-form';

const PROVINCE_CITIES: Record<string, string[]> = {
  '广东': ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '东莞市', '中山市'],
  '江苏': ['南京市', '无锡市', '苏州市', '常州市', '南通市'],
  '浙江': ['杭州市', '宁波市', '温州市', '嘉兴市', '绍兴市'],
  '四川': ['成都市', '绵阳市', '乐山市', '宜宾市'],
  '北京': ['北京市'],
  '上海': ['上海市'],
};

function ProvinceContent() {
  const searchParams = useSearchParams();
  const provinceName = searchParams.get('name') || '';

  const [cities, setCities] = useState<string[]>([]);
  const [visitedCities, setVisitedCities] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  useEffect(() => {
    const provinceCities = PROVINCE_CITIES[provinceName] || [`${provinceName}市`];
    setCities(provinceCities);

    getCoupleId().then((id) => {
      setCoupleId(id);
      if (id) {
        getVisitedCities(id, provinceName).then((visited) => {
          setVisitedCities(visited);
        });
      }
    });
  }, [provinceName]);

  const totalCities = cities.length;
  const visitedCount = visitedCities.length;
  const completionRate = totalCities > 0 ? Math.round((visitedCount / totalCities) * 100) : 0;

  const handleCityClick = (city: string) => {
    window.location.href = `/city?name=${encodeURIComponent(city)}&province=${encodeURIComponent(provinceName)}`;
  };

  const handleTripAdded = () => {
    setShowAddForm(false);
    getCoupleId().then((id) => {
      if (!id) return;
      getVisitedCities(id, provinceName).then((visited) => {
        setVisitedCities(visited);
      });
    });
  };

  return (
    <div className="container">
      {/* Header plaque — province name on a wooden sign */}
      <div className="card text-center relative overflow-hidden mb-6">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#3D2E1F', fontFamily: "var(--font-newsreader)" }}>{provinceName}</h1>
          <div className="flex justify-center gap-8 text-base mb-6" style={{ color: '#9A8B7A' }}>
            <span>已访问 <span className="font-semibold text-lg" style={{ color: '#3D2E1F' }}>{visitedCount}</span>/{totalCities} 个城市</span>
            <span>完成度 <span className="font-semibold text-lg" style={{ color: '#c99a6c' }}>{completionRate}%</span></span>
          </div>
          <div className="h-3 bg-[#F3EBE0] rounded-full overflow-hidden max-w-md mx-auto border border-[#E4D5C0]/30">
            <div
              className="h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${completionRate}%`, background: 'linear-gradient(90deg, #c99a6c, #b8895e)' }}
            />
          </div>
        </div>
      </div>

      {/* Add trip button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #563a31, #705147)',
            color: '#ffffff',
            boxShadow: 'inset 0 1px 0 rgba(255,222,165,0.4), 0 2px 4px rgba(0,0,0,0.3)',
            fontFamily: "var(--font-manrope)",
          }}
        >
          <span>+</span>
          <span>添加旅行</span>
        </button>
      </div>

      {/* Cities — wooden city nameplates on the wall */}
      <RoomPanel title="城市列表">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {cities.map((city) => {
            const isVisited = visitedCities.includes(city);
            return (
              <button
                key={city}
                onClick={() => handleCityClick(city)}
                className={`p-5 rounded-xl text-sm text-center font-medium transition-all duration-200 ${
                  isVisited
                    ? 'border shadow-sm'
                    : 'bg-[#FAF5EF] text-[#6B5438] border border-[#E4D5C0]/40 hover:bg-[#F3EBE0]'
                }`}
                style={
                  isVisited
                    ? {
                        background: 'linear-gradient(135deg, rgba(201,154,108,0.15), rgba(184,137,94,0.1))',
                        borderColor: '#c99a6c',
                        color: '#8d6b2a',
                        boxShadow: 'inset 0 0 0 1px rgba(141,107,42,0.15)',
                      }
                    : {}
                }
              >
                <div className="text-lg mb-1" style={{ color: isVisited ? '#c99a6c' : '#C9A882' }}>
                  {isVisited ? '●' : '○'}
                </div>
                {city.replace('市', '')}
              </button>
            );
          })}
        </div>
      </RoomPanel>

      {/* Add Trip Form */}
      {showAddForm && coupleId && (
        <AddTripForm
          coupleId={coupleId}
          defaultProvince={provinceName}
          onSuccess={handleTripAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}

export default function ProvincePage() {
  return (
    <Suspense fallback={<div className="container text-center py-24" style={{ color: '#9A8B7A' }}>加载中...</div>}>
      <ProvinceContent />
    </Suspense>
  );
}
