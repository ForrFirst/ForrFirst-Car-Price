"use client";

import { useState, useEffect } from "react";
import { cars, Car, carsByCategory } from "./data";
import Image from "next/image";

function getDiscountedPrice(original: number) {
  const price = original - original * 0.1; /* ลด 10% */
  /*const price = original - original * 0.15;*/ /* ลด 15% */
  return Math.floor(price);
}

/** ราคาที่แสดงจริง: ใช้ salePrice ถ้ามี ไม่ใช่ใช้ลด 15% แล้วปัดเศษลง */
function getDisplayPrice(car: Car): number | null {
  if (!car.price) return null;
  return car.salePrice ?? getDiscountedPrice(car.price);
}

export default function Home() {
  const [selected, setSelected] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const selectedCars = cars.filter((car: Car) => selected.includes(car.name));
  const total = selectedCars.reduce((sum: number, car: Car) => {
    const p = getDisplayPrice(car);
    return sum + (p ?? 0);
  }, 0);

  const removeCar = (carName: string) => {
    setSelected(prev => prev.filter(name => name !== carName));
  };

  const clearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    setSelected([]);
    setShowClearConfirm(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const scrollToCategory = (category: string) => {
    const element = document.getElementById(`category-${category}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMenuOpen(false); 
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-12 h-12 mr-3 drop-shadow-lg">
              <Image
                src="/logo.webp"
                alt="Forr First Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
              Forr First
            </h1>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
          {/*🚗 รถแคช Rebirth ลด 15% 🔥*/}🚗 รถแคช Rebirth
          </p>
          <div className="max-w-3xl mx-auto space-y-3">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              เลือกรถทั้งหมดที่ต้องการจะสั่งซื้อ สามารถกดปุ่มลูกศร<span className="text-green-600 font-semibold">สีเขียว</span>ทางด้านขวา
              <br className="hidden sm:block" />
              แล้วแคปรายการทั้งหมดเพื่อส่งรูปให้กับแอดมินทาง Facebook ได้เลยครับ
            </p>
            <div className="inline-block px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm md:text-base text-amber-800 font-medium">
                💡 หมายเหตุ: ราคาที่แสดงอยู่จะเป็นราคาต่ำสุดของรถนั้นๆ หากต้องการเลเวลอื่น โปรดแจ้งแอดมิน
              </p>
            </div>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 mx-auto rounded-full mt-4 shadow-md shadow-blue-400/50"></div>
        </div>

        {/* Desktop Category Navigation - Dynamic Position */}
        <div className={`hidden md:block ${isScrolled ? 'fixed left-4 top-1/2 transform -translate-y-1/2 z-40' : 'mb-8'}`}>
          <div className={`bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-blue-200/50 p-4 ${isScrolled ? 'w-48' : 'w-full'}`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">🚀 เลือก Class</h3>
            <div className={`grid gap-2 ${isScrolled ? 'grid-cols-1' : 'grid-cols-3 lg:grid-cols-7'}`}>
              {Object.keys(carsByCategory).map((category) => (
                <button
                  key={category}
                  onClick={() => scrollToCategory(category)}
                  className={`bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 text-sm ${isScrolled ? 'text-left' : 'text-center'}`}
                >
                  🚗 {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden mb-6 sticky top-4 z-40">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>🚀 เลือก Class</span>
          </button>
        </div>

        {/* Mobile Sidebar */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            ></div>
            
            {/* Sidebar */}
            <div className="absolute right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-md shadow-2xl border-l border-blue-200/50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">🚀 เลือก Class</h3>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {Object.keys(carsByCategory).map((category) => (
                    <button
                      key={category}
                      onClick={() => scrollToCategory(category)}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg text-left"
                    >
                      🚗 {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Car Categories */}
        <div className="grid gap-8">
          {Object.entries(carsByCategory).map(([category, list]) => (
            <div 
              key={category} 
              id={`category-${category}`} 
              className="bg-white rounded-2xl shadow-lg border border-blue-200/50 overflow-hidden"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                minHeight: '200px',
                position: 'relative',
                zIndex: 1,
                isolation: 'isolate'
              }}
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h2 className="text-2xl font-bold text-white text-center">
                  🚗 {category} 🚗
                </h2>
              </div>
              <div className="p-6" style={{ position: 'relative', zIndex: 2 }}>
                {list && list.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {list.map((car: Car) => (
                    <label key={car.name} className="group cursor-pointer">
                      <div className="bg-white rounded-xl p-4 shadow-md border-2 border-transparent group-hover:border-blue-300 transition-all duration-300 hover:shadow-lg h-full relative">
                        {car.isNew && (
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                            <span className="new-badge inline-flex items-center px-2 py-1 rounded-full text-[9px] font-bold bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white whitespace-nowrap">
                              ✨ NEW
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col h-full">
                          <div className="flex items-start space-x-3 mb-3">
                            <input
                              type="checkbox"
                              checked={selected.includes(car.name)}
                              onChange={() =>
                                setSelected(prev =>
                                  prev.includes(car.name)
                                    ? prev.filter(n => n !== car.name)
                                    : [...prev, car.name]
                                )
                              }
                              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-black text-md mb-2 truncate">
                                {car.name}
                              </div>
                            </div>
                          </div>
                          <div className="mt-auto">
                            {car.type === "coupon" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 w-full justify-center">
                                🎫 รถคูปอง <br/>สอบถามราคากับแอดมิน
                              </span>
                            )}
                            {car.type === "keyLE" && car.price && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-full justify-center">
                                🔑 กุญแจLE
                              </span>
                            )}
                            {!car.type && car.price && getDisplayPrice(car) !== null && (
                              <div className="space-y-1 text-center">
                                <div className="text-gray-500 line-through text-xs">ปกติ {car.price} บาท</div>
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                  {car.isSale && (
                                    <span className="sale-badge inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-rose-300 via-orange-200 to-amber-300 text-rose-800 whitespace-nowrap border border-rose-200/60">
                                      🔥 SALE
                                    </span>
                                  )}
                                  <span className="text-blue-600 font-semibold text-md">💸{getDisplayPrice(car)} บาท</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>ไม่มีข้อมูลในหมวดนี้</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Cars Summary */}
        {selectedCars.length > 0 && (
          <div id="order-summary" className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div className="flex justify-between items-center">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
  🚗 จำนวนรถที่เลือก รวมทั้งหมด {selectedCars.length} คัน
  </p>
  <p className="text-sm sm:text-base md:text-lg text-white/80 italic ml-auto mr-auto">
    (แคปส่วนนี้แล้วส่งให้แอดมินครับ)
  </p>
</div>


                   <button
                  onClick={clearAll}
                  className="bg-white/20 hover:bg-white/30 text-white px-2 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>ลบทั้งหมด</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
                {selectedCars.map((car: Car) => (
                  <div key={car.name} className="bg-blue-50 rounded-lg p-3 border border-blue-200 group hover:bg-blue-100 transition-colors duration-200 relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="font-medium text-gray-900 text-sm truncate flex items-center gap-1.5 flex-wrap">
                          {car.name}
                          {car.isNew && (
                            <span className="new-badge inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white whitespace-nowrap">
                              ✨ NEW
                            </span>
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => removeCar(car.name)}
                        className="bg-red-100 hover:bg-red-200 text-red-600 p-1.5 rounded-lg transition-all duration-300 flex-shrink-0"
                        title="ลบรายการนี้"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500 font-medium">
                      🚗 {car.category}
                      </div>
                      {car.type === "coupon" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 w-full justify-center">
                          🎫 รถคูปอง
                        </span>
                      )}
                      {car.type === "keyLE" && car.price && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-full justify-center">
                          🔑 กุญแจLE
                        </span>
                      )}
                      {getDisplayPrice(car) !== null && (
                        <div className="text-center">
                          <div className="text-blue-600 font-semibold text-sm">
                            💸{getDisplayPrice(car)} บาท
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-blue-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-700">รวมทั้งหมด:</span>
                  <span className="text-3xl font-bold text-blue-600">💸{total.toLocaleString()} บาท</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-blue-600">
          <p className="text-sm">© 2024 Forr First - Cash Shop Service</p>
        </div>

        {/* Floating Navigation Buttons - Right Side, Center Vertically */}
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 flex flex-col space-y-3 z-50">
          {/* Scroll to Top Button */}
          <button
            onClick={scrollToTop}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl group"
            title="ไปข้างบนสุด"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>

          {/* Scroll to Bottom Button */}
          {selectedCars.length > 0 && (
            <button
              onClick={scrollToBottom}
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl group"
              title="ไปดูรายการสั่งซื้อ"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          )}
        </div>

        {/* Social Media Buttons - Bottom Right */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
          {/* Facebook Button */}
          <a
            href="https://www.facebook.com/violettobyforrfirst"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl group"
            title="ติดตาม Facebook"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          {/* Messenger Button */}
          <a
  href="https://m.me/violettobyforrfirst?text=รับรถแคชตามรายการนี้ครับ (ส่งรูปรายการทั้งหมดที่แคปไว้ได้เลยครับ)"
  target="_blank"
  rel="noopener noreferrer"
  className="w-[48px] h-[48px] rounded-full bg-white transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center"
  title="ส่งข้อความผ่าน Messenger"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    className="w-6 h-6"
  >
    <path
      fill="#0084FF"
      d="M256 8C119 8 8 119 8 256c0 72 29 137 76 180 8 7 7 12 8 58a20 20 0 0 0 30 18c53-23 54-25 63-22 153 32 320-66 320-234C504 119 393 8 256 8z"
    />
    <path
      fill="#fff"
      d="M405 193l-73 115a37 37 0 0 1-54 10l-58-43a15 15 0 0 0-18 0l-78 59c-10 8-24-5-17-16l73-115a37 37 0 0 1 54-10l58 43a15 15 0 0 0 18 0l78-59c10-8 24 5 17 16z"
    />
  </svg>
</a>

        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          ></div>
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-blue-200/50 p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              ยืนยันการลบทั้งหมด
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              คุณต้องการลบรถทั้งหมดที่เลือกไว้ ({selectedCars.length} คัน) ใช่หรือไม่?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-all duration-300"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmClearAll}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>🗑️</span>
                <span>ตกลง</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
