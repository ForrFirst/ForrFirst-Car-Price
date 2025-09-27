import { useState } from "react";
import { cars, Car } from "./data";

function getDiscountedPrice(original: number) {
  let price = original;
  price -= price * 0.25;
  price -= price * 0.10;
  return Math.round(price);
}

export default function Home() {
  const [selected, setSelected] = useState<string[]>([]);

  const grouped = cars.reduce((acc: Record<string, Car[]>, car: Car) => {
    acc[car.category] = acc[car.category] || [];
    acc[car.category].push(car);
    return acc;
  }, {} as Record<string, Car[]>);

  const selectedCars = cars.filter((car: Car) => selected.includes(car.name));
  const total = selectedCars.reduce((sum: number, car: Car) => sum + (car.price ? getDiscountedPrice(car.price) : 0), 0);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">เลือกรถที่คุณต้องการ</h1>
      {Object.entries(grouped).map(([category, list]) => (
        <div key={category} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">🚗🚗🚗🚗 {category} 🚗🚗🚗🚗</h2>
          {(list as Car[]).map((car: Car) => (
            <label key={car.name} className="block">
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
                className="mr-2"
              />
              {car.name}
              {car.type === "coupon" && " (รถคูปอง)"}
              {car.type === "keyLE" && car.price && ` (กุญแจLE 💸${getDiscountedPrice(car.price)}บาท)`}
              {!car.type && car.price && ` ปกติ ${car.price}บาท ลดเหลือ 💸${getDiscountedPrice(car.price)}บาท`}
            </label>
          ))}
        </div>
      ))}

      {selectedCars.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">รายการที่คุณเลือก:</h2>
          <ul className="list-disc pl-5">
            {selectedCars.map((car: Car) => (
              <li key={car.name}>
                {car.name}
                {car.type === "coupon" && " (รถคูปอง)"}
                {car.type === "keyLE" && car.price && ` (กุญแจLE 💸${getDiscountedPrice(car.price)}บาท)`}
                {!car.type && car.price && ` ปกติ ${car.price}บาท ลดเหลือ 💸${getDiscountedPrice(car.price)}บาท`}
              </li>
            ))}
          </ul>
          <p className="mt-4 font-bold text-lg">รวมทั้งหมด 💸{total} บาท</p>
        </div>
      )}
    </main>
  );
}
