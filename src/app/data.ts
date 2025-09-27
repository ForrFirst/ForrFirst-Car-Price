// data.ts
export type Car = {
    name: string;
    price?: number;
    category: string;
    type?: "coupon" | "keyLE";
  };
  
  export const cars: Car[] = [
    { name: "Spice", price: 249, category: "City" },
    { name: "Tutuki", price: 189, category: "City" },
    { name: "Blizzard6", category: "Sports", type: "coupon" },
    { name: "Zet SL", price: 309, category: "Sports", type: "keyLE" },
    // ... เพิ่มรถทั้งหมดตามลำดับที่คุณส่งมา
  ];
  