"use client";

import { useState } from "react";
import { cars, Car, carsByCategory } from "./data";

function getDiscountedPrice(original: number) {
  let price = original;
  price -= price * 0.25;
  price -= price * 0.10;
  return Math.round(price);
}

export default function Home() {
  const [selected, setSelected] = useState<string[]>([]);

  const selectedCars = cars.filter((car: Car) => selected.includes(car.name));
  const total = selectedCars.reduce((sum: number, car: Car) => sum + (car.price ? getDiscountedPrice(car.price) : 0), 0);

  const removeCar = (carName: string) => {
    setSelected(prev => prev.filter(name => name !== carName));
  };

  const clearAll = () => {
    setSelected([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Forr First</h1>
          <p className="text-xl text-blue-700 mb-6">เลือกรถที่คุณต้องการ</p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 mx-auto rounded-full"></div>
        </div>

        {/* Car Categories */}
        <div className="grid gap-8">
          {Object.entries(carsByCategory).map(([category, list]) => (
            <div key={category} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h2 className="text-2xl font-bold text-white text-center">
                  🚗 {category} 🚗
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {list.map((car: Car) => (
                    <label key={car.name} className="group cursor-pointer">
                      <div className="bg-white rounded-xl p-4 shadow-md border-2 border-transparent group-hover:border-blue-300 transition-all duration-300 hover:shadow-lg h-full">
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
                              <div className="font-semibold text-gray-900 text-sm mb-2 truncate">
                                {car.name}
                              </div>
                            </div>
                          </div>
                          <div className="mt-auto">
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
                            {!car.type && car.price && (
                              <div className="space-y-1 text-center">
                                <div className="text-gray-500 line-through text-xs">ปกติ {car.price}บาท</div>
                                <div className="text-blue-600 font-semibold text-sm">
                                  💸{getDiscountedPrice(car.price)}บาท
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Cars Summary */}
        {selectedCars.length > 0 && (
          <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  🛒 รายการที่คุณเลือก ({selectedCars.length} รายการ)
                </h2>
                <button
                  onClick={clearAll}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2"
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
                        <span className="font-medium text-gray-900 text-sm truncate">{car.name}</span>
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
                      {car.price && (
                        <div className="text-center">
                          <div className="text-blue-600 font-semibold text-sm">
                            💸{getDiscountedPrice(car.price)}บาท
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
                  <span className="text-3xl font-bold text-blue-600">💸{total}บาท</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-blue-600">
          <p className="text-sm">© 2024 Forr First - Car Selection Service</p>
        </div>
      </div>
    </div>
  );
}
