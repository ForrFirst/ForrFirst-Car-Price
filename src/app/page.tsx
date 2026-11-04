"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { cars, Car, carsByCategory } from "./data";
import Image from "next/image";

/**
 * คำนวณราคาหลังลด แล้วปัดเศษเป็นจำนวนเต็ม
 *
 * กติกาการปัดเศษที่ใช้อยู่ (ปัดเศษปกติ):
 *   - ทศนิยม < .5  → ปัดลง  เช่น 224.1 → 224
 *   - ทศนิยม >= .5 → ปัดขึ้น เช่น 184.5 → 185, 211.7 → 212
 *
 * ถ้าอยากเปลี่ยนกติกา ให้แก้บรรทัด return ด้านล่าง:
 *   - ปัดขึ้นเสมอ : return Math.ceil(rounded);
 *   - ปัดลงเสมอ  : return Math.floor(rounded);
 *   - ปัดปกติ    : return Math.round(rounded);   <- ใช้อยู่ตอนนี้
 */
function getDiscountedPrice(original: number) {
  const price = original - original * 0.1;   /* ลด 10% */
  // const price = original - original * 0.15; /* ลด 15% */
  // const price = original * 0.8 * 0.9;         /* ลด 20+10% */
  // const price = original * 0.8 * 0.85;         /* ลด 20+15% */
  // const price = original * 0.8 * 0.88;       /* ลด 20%+12% */

  // คอมพิวเตอร์เก็บทศนิยมคลาดเคลื่อนได้ เช่น 184.5 อาจกลายเป็น 184.49999999999997
  // ทำให้ Math.round ปัดลงผิด จึงตัดเหลือ 2 ตำแหน่งก่อน (toFixed) แล้วค่อยปัดเศษ
  const rounded = Number(price.toFixed(2));

  return Math.round(rounded);
}

/**
 * ราคาที่แสดงจริง
 *   - ถ้ากำหนด salePrice ไว้ใน data.ts → ใช้ค่านั้นตรง ๆ (ไม่คำนวณลดซ้ำ)
 *   - ถ้าไม่มี → ใช้ราคาที่ลดและปัดเศษแล้วจาก getDiscountedPrice
 *   - ถ้าไม่มีราคา (เช่น รถคูปอง) → คืน null แล้วหน้าเว็บจะแสดงว่า "สอบถาม"
 * ปัดเศษทำที่ getDiscountedPrice แล้ว จึงไม่ต้องปัดซ้ำที่นี่
 */
function getDisplayPrice(car: Car): number | null {
  if (!car.price) return null;
  return car.salePrice ?? getDiscountedPrice(car.price);
}

/**
 * วาดรูปรายการสั่งซื้อลง canvas "จากข้อมูลโดยตรง" (ชื่อรถ + ราคาจาก data.ts)
 * ไม่ได้ถ่ายรูปจากหน้าเว็บ (DOM) ดังนั้นถ้าลูกค้าแก้ตัวเลขบนหน้าจอผ่าน Inspect
 * ตัวเลขที่แก้จะไม่ติดไปในรูป
 */
async function renderOrderImage(
  list: Car[]
): Promise<{ url: string; blob: Blob; filename: string }> {
  // รอฟอนต์โหลดให้เสร็จก่อนวาด
  try {
    await document.fonts?.ready;
  } catch {}

  const now = new Date(); // เวลา ณ ตอนที่กดบันทึกรูป (ใช้ทั้งในรูปและชื่อไฟล์)
  const FONT = '"Noto Sans Thai", Tahoma, Thonburi, ui-sans-serif, system-ui, Arial, sans-serif';
  const W = 720; // ความกว้างรูป (หน่วยตรรกะ)
  const PAD = 24;
  const HEADER_H = 88;
  const COLHEAD_H = 34;
  const ROW_H = 44;
  const FOOT_PAD = 18;

  const prices = list.map((car) => getDisplayPrice(car));
  const total = prices.reduce<number>((sum, p) => sum + (p ?? 0), 0);
  const totalList = list.reduce((sum, car) => sum + (car.price ?? 0), 0);
  const showBefore = totalList > 0 && totalList !== total;

  const footerH = FOOT_PAD * 2 + 40 + (showBefore ? 28 : 0);
  const credit_H = 34;
  const H = HEADER_H + COLHEAD_H + list.length * ROW_H + footerH + credit_H;

  // จำกัดขนาด canvas ไม่ให้ใหญ่เกินที่มือถือรับไหว (โดยเฉพาะ iOS)
  const scale = Math.min(2, Math.sqrt(12_000_000 / (W * H)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas not supported");
  ctx.scale(scale, scale);
  ctx.textBaseline = "middle";

  // ตัดข้อความที่ยาวเกินพื้นที่ แล้วต่อท้ายด้วย …
  const fit = (text: string, maxW: number) => {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
    return t + "…";
  };
  // ข้อความมีเส้นขีดฆ่า (ราคาปกติ) ชิดขวา
  const strikeRight = (text: string, xRight: number, y: number) => {
    ctx.textAlign = "right";
    ctx.fillText(text, xRight, y);
    const w = ctx.measureText(text).width;
    ctx.beginPath();
    ctx.moveTo(xRight - w, y);
    ctx.lineTo(xRight, y);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = ctx.fillStyle as string;
    ctx.stroke();
  };

  // พื้นหลังขาว
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // ===== หัวรูป (แถบเขียว) =====
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "#22c55e");
  grad.addColorStop(1, "#059669");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HEADER_H);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillText(`🚗 รวมทั้งหมด ${list.length} คัน`, PAD, 36);
  // timestamp วันที่-เวลาที่บันทึกรูป (มีวินาที) แสดงใต้หัวข้อ
  ctx.font = `600 17px ${FONT}`;
  const stamp = now.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
  ctx.fillText(`🕒 บันทึกเมื่อ ${stamp}`, PAD, 66);

  // ===== หัวตาราง =====
  const X_IDX = PAD + 8; // ลำดับ (กึ่งกลาง)
  const X_NAME = PAD + 40;
  const X_CAT = 340;
  const X_LIST = 560; // ราคาปกติ (ชิดขวา)
  const X_PRICE = W - PAD; // ราคาขาย (ชิดขวา)
  let y = HEADER_H;
  ctx.fillStyle = "#eff6ff";
  ctx.fillRect(0, y, W, COLHEAD_H);
  ctx.fillStyle = "#6b7280";
  ctx.font = `600 14px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("#", X_IDX, y + COLHEAD_H / 2);
  ctx.textAlign = "left";
  ctx.fillText("รถ", X_NAME, y + COLHEAD_H / 2);
  ctx.fillText("Class", X_CAT, y + COLHEAD_H / 2);
  ctx.textAlign = "right";
  ctx.fillText("ปกติ", X_LIST, y + COLHEAD_H / 2);
  ctx.fillText("ราคา", X_PRICE, y + COLHEAD_H / 2);
  y += COLHEAD_H;

  // ===== แถวรายการ =====
  list.forEach((car, i) => {
    const price = prices[i];
    const cy = y + ROW_H / 2;
    ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#f8fbff";
    ctx.fillRect(0, y, W, ROW_H);
    ctx.fillStyle = "#dbeafe";
    ctx.fillRect(0, y + ROW_H - 1, W, 1);

    // ลำดับ
    ctx.fillStyle = "#6b7280";
    ctx.font = `15px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(String(i + 1), X_IDX, cy);

    // ชื่อรถ (+ ไอคอนรถใหม่/คูปอง)
    const tag = car.isNew ? " ✨" : car.type === "coupon" || car.type === "keyLE" ? " 🔑" : "";
    ctx.fillStyle = "#111827";
    ctx.font = `bold 17px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(fit(car.name + tag, X_CAT - X_NAME - 12), X_NAME, cy);

    // Class
    ctx.fillStyle = "#6b7280";
    ctx.font = `15px ${FONT}`;
    ctx.fillText(fit(car.category, X_LIST - 70 - X_CAT), X_CAT, cy);

    // ราคาปกติ (ขีดฆ่า) — แสดงเมื่อมีส่วนลด
    if (price !== null && car.price != null && car.price !== price) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = `15px ${FONT}`;
      strikeRight(car.price.toLocaleString(), X_LIST, cy);
    }

    // ราคาขาย หรือ "สอบถาม" (รถคูปอง)
    ctx.textAlign = "right";
    if (price !== null) {
      ctx.fillStyle = "#2563eb";
      ctx.font = `bold 18px ${FONT}`;
      ctx.fillText(price.toLocaleString(), X_PRICE, cy);
    } else {
      ctx.fillStyle = "#16a34a";
      ctx.font = `600 15px ${FONT}`;
      ctx.fillText("สอบถาม", X_PRICE, cy);
    }
    y += ROW_H;
  });

  // ===== สรุปยอดรวม =====
  ctx.fillStyle = "#a7f3d0";
  ctx.fillRect(0, y, W, 2);
  const fg = ctx.createLinearGradient(0, y, W, y);
  fg.addColorStop(0, "#eff6ff");
  fg.addColorStop(1, "#ecfdf5");
  ctx.fillStyle = fg;
  ctx.fillRect(0, y + 2, W, footerH - 2);

  let fy = y + FOOT_PAD + 20;
  if (showBefore) {
    ctx.fillStyle = "#6b7280";
    ctx.font = `16px ${FONT}`;
    strikeRight(`ปกติ ${totalList.toLocaleString()} บาท`, X_PRICE, fy);
    fy += 28;
  }
  ctx.fillStyle = "#374151";
  ctx.font = `bold 22px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("รวมทั้งหมด", PAD, fy);
  ctx.fillStyle = "#2563eb";
  ctx.font = `bold 32px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(`${total.toLocaleString()} บาท 💸`, X_PRICE, fy);
  y += footerH;

  // ===== เครดิตท้ายรูป =====
  ctx.fillStyle = "#9ca3af";
  ctx.font = `13px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("Forr First - Cash Shop Service", W / 2, y + credit_H / 2);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
  );
  // ชื่อไฟล์มี timestamp เช่น forr-first-order-20261104-143005.png
  const p2 = (n: number) => String(n).padStart(2, "0");
  const filename = `forr-first-order-${now.getFullYear()}${p2(now.getMonth() + 1)}${p2(now.getDate())}-${p2(now.getHours())}${p2(now.getMinutes())}${p2(now.getSeconds())}.png`;

  return { url: canvas.toDataURL("image/png"), blob, filename };
}

/** ลิงก์เพิ่มเพื่อน/แชท LINE OA — ตั้งค่าใน .env เป็น NEXT_PUBLIC_LINE_URL หรือแก้ค่าเริ่มต้นด้านล่าง */
const lineContactUrl =
  process.env.NEXT_PUBLIC_LINE_URL?.trim() ||
  "https://lin.ee/rGcJh5Y";

const MOBILE_ORDER_ROW_GRID =
  "grid grid-cols-[1.25rem_minmax(0,38%)_minmax(2rem,14%)_3rem_3rem] gap-x-2 items-center";
const MOBILE_SWIPE_DELETE_WIDTH = 64;

function MobileSwipeOrderRow({
  car,
  index,
  onRemove,
}: {
  car: Car;
  index: number;
  onRemove: () => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const touchStartX = useRef(0);
  const touchStartOffset = useRef(0);
  const price = getDisplayPrice(car);
  const tag = car.isNew ? "✨" : car.type === "coupon" ? "🔑" : car.type === "keyLE" ? "🔑" : "";

  const snapOpen = () => setOffsetX(-MOBILE_SWIPE_DELETE_WIDTH);
  const snapClosed = () => setOffsetX(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartOffset.current = offsetX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const next = Math.min(0, Math.max(-MOBILE_SWIPE_DELETE_WIDTH, touchStartOffset.current + dx));
    setOffsetX(next);
  };

  const onTouchEnd = () => {
    setOffsetX((current) =>
      current < -MOBILE_SWIPE_DELETE_WIDTH / 2 ? -MOBILE_SWIPE_DELETE_WIDTH : 0
    );
  };

  return (
    <li className="relative overflow-hidden border-b border-blue-100 last:border-b-0">
      <div
        className="absolute inset-y-0.5 right-0.5 flex items-center justify-center bg-red-400 text-white"
        style={{ width: MOBILE_SWIPE_DELETE_WIDTH }}
      >
        <button
          type="button"
          className="h-full w-full text-xs font-semibold"
          onClick={() => {
            onRemove();
            snapClosed();
          }}
        >
          ลบ
        </button>
      </div>
      <div
        className={`${MOBILE_ORDER_ROW_GRID} h-8 bg-white text-sm leading-tight select-none`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition:
            offsetX === 0 || offsetX === -MOBILE_SWIPE_DELETE_WIDTH
              ? "transform 0.2s ease-out"
              : "none",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <span className="text-center text-gray-500 tabular-nums">{index + 1}</span>
        <span className="font-semibold text-gray-900 pl-3 text-left justify-self-start" title={car.name}>
          {car.name}
          {tag && <span className="ml-1">{tag}</span>}
        </span>
        <span className="text-gray-500 text-left justify-self-start" title={car.category}>
          {car.category}
        </span>
        <span className="text-right text-gray-400 line-through tabular-nums">
          {price !== null && car.price != null && car.price !== price
            ? car.price.toLocaleString()
            : "—"}
        </span>
        <span className="text-right font-bold text-blue-600 tabular-nums">
          {price !== null ? (
            price.toLocaleString()
          ) : (
            <span className="text-green-600 text-xs font-medium">สอบถาม</span>
          )}
        </span>
      </div>
    </li>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [savedImage, setSavedImage] = useState<{ url: string; blob: Blob; filename: string } | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredCarsByCategory = Object.fromEntries(
    Object.entries(carsByCategory)
      .map(([category, list]) => [
        category,
        normalizedSearch
          ? list.filter(
              (car) =>
                car.name.toLowerCase().includes(normalizedSearch) ||
                car.category.toLowerCase().includes(normalizedSearch)
            )
          : list,
      ])
      .filter(([, list]) => !normalizedSearch || (list as Car[]).length > 0)
  ) as typeof carsByCategory;

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  /** ตอนโฟกัสช่องค้นหา (โดยเฉพาะมือถือ) หน้าจะเลื่อนไม่ได้ — blur เมื่อเริ่ม scroll */
  useEffect(() => {
    if (!isSearchOpen) return;

    const blurSearch = () => {
      if (document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("touchmove", blurSearch, { passive: true });
    window.addEventListener("wheel", blurSearch, { passive: true });
    return () => {
      window.removeEventListener("touchmove", blurSearch);
      window.removeEventListener("wheel", blurSearch);
    };
  }, [isSearchOpen]);

  /** ค้นหาแล้วกระโดดขึ้นบน เพื่อให้เห็นผลลัพธ์และเลื่อนต่อได้ */
  useEffect(() => {
    if (!normalizedSearch) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [normalizedSearch]);

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const selectedCars = cars.filter((car: Car) => selected.includes(car.name));
  const couponCarNames = Object.values(filteredCarsByCategory).flatMap((list) =>
    list.filter((car) => car.type === "coupon").map((car) => car.name)
  );
  const isAllCouponsSelected =
    couponCarNames.length > 0 &&
    couponCarNames.every((name) => selected.includes(name));

  const toggleSelectCoupons = () => {
    if (isAllCouponsSelected) {
      setSelected((prev) => prev.filter((name) => !couponCarNames.includes(name)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...couponCarNames])]);
    }
  };

  // ===== เลือกรถใหม่ (isNew: true ใน data.ts) ทั้งหมดในครั้งเดียว =====
  // ทำงานเหมือนปุ่มเลือกรถคูปอง: กดครั้งแรกเลือกทั้งหมด กดอีกครั้งยกเลิกเฉพาะรถใหม่
  // (นับเฉพาะรถที่ยังแสดงอยู่ตามผลค้นหา)
  const newCarNames = Object.values(filteredCarsByCategory).flatMap((list) =>
    list.filter((car) => car.isNew).map((car) => car.name)
  );
  const isAllNewSelected =
    newCarNames.length > 0 && newCarNames.every((name) => selected.includes(name));

  const toggleSelectNewCars = () => {
    if (isAllNewSelected) {
      setSelected((prev) => prev.filter((name) => !newCarNames.includes(name)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...newCarNames])]);
    }
  };

  const total = selectedCars.reduce((sum: number, car: Car) => {
    const p = getDisplayPrice(car);
    return sum + (p ?? 0);
  }, 0);
  const totalListPrice = selectedCars.reduce(
    (sum: number, car: Car) => sum + (car.price ?? 0),
    0
  );
  const showTotalBeforeDiscount = totalListPrice > 0 && totalListPrice !== total;

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

  /**
   * สร้างรูปจากข้อมูลรถที่เลือก (selected + data.ts) ไม่ได้อ่านจากหน้าเว็บ
   * ใช้ cars กรองจาก selected ตรง ๆ เพื่อไม่ให้พึ่งค่าที่แสดงบนหน้าจอ
   */
  const saveSummaryImage = async () => {
    if (isSavingImage || selected.length === 0) return;
    setIsSavingImage(true);
    try {
      const list = cars.filter((car: Car) => selected.includes(car.name));
      setCopyStatus("idle");
      setSavedImage(await renderOrderImage(list));
    } catch (err) {
      console.error(err);
      alert("สร้างรูปไม่สำเร็จ ลองแคปหน้าจอรายการแทนได้เลยครับ");
    } finally {
      setIsSavingImage(false);
    }
  };

  /** คัดลอกรูปไปคลิปบอร์ด (ใช้ได้เฉพาะเบราว์เซอร์ที่รองรับ และต้องเป็น HTTPS) */
  const canCopyImage =
    typeof window !== "undefined" &&
    "ClipboardItem" in window &&
    typeof navigator.clipboard?.write === "function";

  const copyImage = async () => {
    if (!savedImage) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": savedImage.blob }),
      ]);
      setCopyStatus("copied");
    } catch (err) {
      console.error(err);
      setCopyStatus("failed");
    }
    setTimeout(() => setCopyStatus("idle"), 2500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    const summary = document.getElementById("order-summary");
    if (summary) {
      summary.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  const scrollToCategory = (category: string) => {
    const element = document.getElementById(`category-${category}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMenuOpen(false);
  };

  /** รีเฟรชหรือเข้าหน้าใหม่ให้เริ่มที่ด้านบนเหมือนเว็บทั่วไป */
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
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
          <p className="text-xl md:text-3xl font-bold text-gray-800 mb-4">
          {/* 🚗 รถแคช Rebirth ลด 32% 🔥 */}
          🚗 รถแคช Rebirth🔥
          </p>
          <div className="max-w-3xl mx-auto space-y-3">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              เลือกรถทั้งหมดที่ต้องการจะสั่งซื้อ สามารถกดปุ่มลูกศร<span className="text-green-600 font-semibold">สีเขียว</span>ทางด้านขวา
              <br className="hidden sm:block" />
              แล้วกดปุ่มบันทึกรูปรายการ เพื่อส่งรูปให้กับแอดมินทาง Facebook หรือ LINE ได้เลยครับ
            </p>
            {/* เงื่อนไขและข้อตกลงก่อนสั่งซื้อ */}
            <div className="text-left bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-md px-4 py-3 md:px-5 md:py-4">
              <p className="text-base md:text-lg font-bold text-indigo-900 mb-2">
                📌 เงื่อนไขและข้อตกลงก่อนสั่งซื้อ
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm md:text-base text-gray-700 marker:text-indigo-400">
                <li>
                  ราคาที่แสดงเป็น<span className="font-bold text-indigo-900">ราคาต่ำสุด</span>ของรถนั้นๆ{" "}
                  <span className="text-amber-700">
                    (หากต้องการสั่งซื้อเลเวลอื่น โปรดติดต่อแอดมินก่อนชำระเงิน)
                  </span>
                </li>
                <li>
                  โปรดตรวจสอบ “<span className="font-bold text-indigo-900">เลเวลตัวละคร 👤</span>”
                  ของท่านให้ตรงตามเงื่อนไขของทางเกมก่อนกดสั่งซื้อทุกครั้ง
                </li>
                <li className="font-bold text-red-600 marker:text-red-500">
                  หากเลเวลไม่ตรงตามเงื่อนไขจนไม่สามารถรับ/ใช้งานได้ ทางร้านขอสงวนสิทธิ์
                  <span className="underline">ไม่รับเปลี่ยนสินค้า คืนเงิน หรือชดเชยทุกกรณี</span>
                </li>
              </ul>
              <p className="mt-2 pt-2 border-t border-blue-200/70 text-xs md:text-sm italic text-indigo-400">
                * การชำระเงินถือว่าผู้ซื้อได้อ่าน เข้าใจ และยอมรับเงื่อนไขนี้แล้วโดยสมบูรณ์
              </p>
            </div>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 mx-auto rounded-full mt-4 shadow-md shadow-blue-400/50"></div>
        </div>

        {/* Desktop Category Navigation */}
        <div className="hidden md:block mb-8">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-blue-200/50 p-4 w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">🚀 เลือก Class</h3>
            <div className="grid gap-2 grid-cols-3 lg:grid-cols-7">
              {Object.keys(carsByCategory).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => scrollToCategory(category)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 text-sm text-center"
                >
                  🚗 {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search bar */}
        {isSearchOpen && (
          <div className="mb-6 sticky top-4 z-40">
            <div className="w-full flex items-center gap-2 bg-white rounded-lg shadow-lg border border-blue-200 px-3 py-2.5 sm:px-4 sm:py-3">
              <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchInputRef.current?.blur();
                  }
                }}
                placeholder="ค้นหาชื่อรถ ..."
                className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-gray-800 placeholder:text-gray-400 outline-none"
                enterKeyHint="done"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="ล้างคำค้นหา"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeSearch}
                  className="text-xs sm:text-sm font-semibold text-blue-600 px-1.5 py-1 shrink-0"
                >
                  ปิด
                </button>
              )}
            </div>
          </div>
        )}

        {/* Class menu — mobile sidebar */}
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
          {normalizedSearch && Object.keys(filteredCarsByCategory).length === 0 ? (
            <div className="bg-white/90 rounded-2xl shadow-lg border border-blue-200/50 p-8 text-center text-gray-500">
              ไม่พบรถที่ตรงกับ “{searchQuery.trim()}”
            </div>
          ) : null}
          {Object.entries(filteredCarsByCategory).map(([category, list]) => (
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
                              onChange={() => {
                                searchInputRef.current?.blur();
                                setSelected(prev =>
                                  prev.includes(car.name)
                                    ? prev.filter(n => n !== car.name)
                                    : [...prev, car.name]
                                );
                              }}
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
                                🔑 รถคูปอง <br/>สอบถามราคากับแอดมิน
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
                                  {/* ป้าย sale */}
                                  {/* {car.isSale && (
                                    <span className="sale-badge inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-rose-300 via-orange-200 to-amber-300 text-rose-800 whitespace-nowrap border border-rose-200/60">
                                      🔥 SALE
                                    </span>
                                  )} */}
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
            {/* Header — mobile compact */}
            <div className="md:hidden bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-2">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-md font-bold text-white leading-tight">
                  🚗 รวมทั้งหมด {selectedCars.length} คัน
                  </p>
                  <p className="text-xs text-white/90 mt-0.5">
                  (กดบันทึกรูปด้านล่าง แล้วส่งให้แอดมินครับ)
                  </p>
                </div>
                <button
                  onClick={clearAll}
                  className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-300"
                >
                  🗑️ ลบทั้งหมด
                </button>
              </div>
            </div>

            {/* Header — desktop original */}
            <div className="hidden md:block bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    🚗 รวมทั้งหมด {selectedCars.length} คัน
                  </p>
                  <p className="text-sm sm:text-base md:text-lg text-white/80 italic">
                    (กดบันทึกรูปด้านล่าง แล้วส่งให้แอดมินครับ)
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

            {/* Mobile — ตาราง + ปัดซ้ายเพื่อลบ */}
            <div className="md:hidden px-2 py-2 pr-8">
          
              <p className="text-[10px] text-gray-400 text-center py-0.3">
                ปัดไปทางซ้ายเพื่อลบ
              </p>
              <ul>
                {selectedCars.map((car: Car, index: number) => (
                  <MobileSwipeOrderRow
                    key={car.name}
                    car={car}
                    index={index}
                    onRemove={() => removeCar(car.name)}
                  />
                ))}
              </ul>
              <div className="border-t-2 border-emerald-200 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-b-lg py-2 px-2 text-center tabular-nums">
                <p className="text-md leading-snug flex flex-wrap items-center justify-center gap-x-3 gap-y-0">
                  <span className="font-semibold text-gray-700">รวมทั้งหมด</span>
                  {showTotalBeforeDiscount && (
                    <span className="text-gray-500 line-through">
                      {totalListPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="font-bold text-blue-600 text-xl">
                    {total.toLocaleString()} บาท 💸
                  </span>
                </p>
              </div>
            </div>

            {/* Desktop — original card grid */}
            <div className="hidden md:block p-6">
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
                          🔑 รถคูปอง
                        </span>
                      )}
                      {car.type === "keyLE" && car.price && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-full justify-center">
                          🔑 กุญแจLE
                        </span>
                      )}
                      {getDisplayPrice(car) !== null && (
                        <div className="text-center space-y-1">
                          {car.price != null && car.price !== getDisplayPrice(car) && (
                            <div className="text-gray-500 line-through text-xs">
                              ปกติ {car.price} บาท
                            </div>
                          )}
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
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-end">
                  <span className="text-xl font-semibold text-gray-700">รวมทั้งหมด:</span>
                  <div className="text-right space-y-1 tabular-nums">
                    {showTotalBeforeDiscount && (
                      <div className="text-lg text-gray-500 line-through">
                        ปกติ {totalListPrice.toLocaleString()} บาท
                      </div>
                    )}
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {showTotalBeforeDiscount ? "รวมทั้งหมด " : ""}{total.toLocaleString()} บาท💸
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ปุ่มบันทึกรูป — วาดรูปจากข้อมูลโดยตรง */}
            <div className="px-3 pb-4 pt-1 md:px-6 md:pb-6">
              <button
                type="button"
                onClick={saveSummaryImage}
                disabled={isSavingImage}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold shadow-md transition-all duration-300"
              >
                {isSavingImage ? "⏳ กำลังสร้างรูป..." : "📷 บันทึกรูปรายการ"}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-blue-600">
          <p className="text-sm">© 2024 Forr First - Cash Shop Service</p>
        </div>

        {/* Floating Navigation — ขวากลางจอ */}
        <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col items-end gap-2 sm:gap-3 z-50">
          <div className="relative">
            {isMenuOpen && (
              <div className="hidden md:block absolute right-14 top-0 w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-blue-200/50 p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2 text-center">🚀 เลือก Class</p>
                <div className="grid gap-1.5">
                  {Object.keys(carsByCategory).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => scrollToCategory(category)}
                      className="w-full text-left bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-3 py-2 rounded-lg font-semibold text-sm"
                    >
                      🚗 {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                setIsMenuOpen((open) => !open);
              }}
              className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:shadow-xl group ${
                isMenuOpen
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-blue-600 border border-blue-200"
              }`}
              title="เลือก Class"
              aria-label="เลือก Class"
              aria-expanded={isMenuOpen}
            >
              <span className="text-lg sm:text-xl leading-none group-hover:scale-110 inline-block transition-transform duration-300">🚀</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isSearchOpen) closeSearch();
              else {
                setIsMenuOpen(false);
                setIsSearchOpen(true);
              }
            }}
            className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:shadow-xl group ${
              isSearchOpen || searchQuery
                ? "bg-indigo-600 text-white"
                : "bg-white text-blue-600 border border-blue-200"
            }`}
            title="ค้นหารถ"
            aria-label={isSearchOpen ? "ปิดค้นหา" : "ค้นหารถ"}
            aria-expanded={isSearchOpen}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <div className="h-px w-6 sm:w-8 bg-blue-200 mr-2" aria-hidden="true"></div>
          <button
            type="button"
            onClick={toggleSelectCoupons}
            disabled={couponCarNames.length === 0}
            className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:shadow-xl group disabled:opacity-40 disabled:cursor-not-allowed ${
              isAllCouponsSelected
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-white text-emerald-600 border border-emerald-200"
            }`}
            title={isAllCouponsSelected ? "ยกเลิกเลือกรถคูปองทั้งหมด" : "เลือกรถคูปองทั้งหมด"}
            aria-label={isAllCouponsSelected ? "ยกเลิกเลือกรถคูปองทั้งหมด" : "เลือกรถคูปองทั้งหมด"}
            aria-pressed={isAllCouponsSelected}
          >
            <span className="text-lg sm:text-xl leading-none group-hover:scale-110 inline-block transition-transform duration-300">🔑</span>
          </button>
          {/* ปุ่มเลือกรถใหม่ทั้งหมด — ปุ่มกลมขนาดเท่าปุ่มอื่น สีไล่ฟ้า-ฟ้าอมเขียวเหมือนป้าย ✨ NEW บนการ์ดรถ */}
          <button
            type="button"
            onClick={toggleSelectNewCars}
            disabled={newCarNames.length === 0}
            className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl group text-white disabled:opacity-40 disabled:cursor-not-allowed ${
              isAllNewSelected
                ? "bg-gradient-to-r from-blue-700 via-cyan-600 to-blue-800 ring-2 ring-cyan-400 ring-offset-2"
                : "bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700"
            }`}
            title={isAllNewSelected ? "ยกเลิกเลือกรถใหม่ทั้งหมด" : "เลือกรถใหม่ทั้งหมด"}
            aria-label={isAllNewSelected ? "ยกเลิกเลือกรถใหม่ทั้งหมด" : "เลือกรถใหม่ทั้งหมด"}
            aria-pressed={isAllNewSelected}
          >
            <span className="text-xs sm:text-sm leading-none inline-block group-hover:scale-110 transition-transform duration-300">
              {isAllNewSelected ? "✓" : "✨"}
            </span>
            <span className="text-[9px] sm:text-[11px] font-extrabold leading-none">NEW</span>
          </button>
          <div className="h-px w-6 sm:w-8 bg-blue-200 mr-2" aria-hidden="true"></div>
          <button
            onClick={scrollToTop}
            className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:shadow-xl group"
            title="ไปข้างบนสุด"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
          {/* ปุ่มลงไปดูรายการ: ซ่อนด้วย invisible (ยังกินที่) เพื่อไม่ให้ปุ่มอื่นเลื่อนตอนเลือก/ยกเลิกรถ */}
          <button
              type="button"
              onClick={scrollToBottom}
              disabled={selectedCars.length === 0}
              tabIndex={selectedCars.length === 0 ? -1 : 0}
              aria-hidden={selectedCars.length === 0}
              className={`bg-green-600 hover:bg-green-700 text-white w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:shadow-xl group ${
                selectedCars.length === 0 ? "invisible pointer-events-none" : ""
              }`}
              title="ไปดูรายการสั่งซื้อ"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
        </div>

        {/* Social Media — desktop: แยกปุ่ม */}
        <div className="hidden md:flex fixed bottom-6 right-6 flex-col space-y-3 z-50">
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
          <a
            href="https://m.me/violettobyforrfirst?text=รับรถแคชตามรายการนี้ครับ (ส่งรูปรายการที่บันทึกไว้ได้เลยครับ)"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center"
            title="ส่งข้อความผ่าน Messenger"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6">
              <path fill="#0084FF" d="M256 8C119 8 8 119 8 256c0 72 29 137 76 180 8 7 7 12 8 58a20 20 0 0 0 30 18c53-23 54-25 63-22 153 32 320-66 320-234C504 119 393 8 256 8z" />
              <path fill="#fff" d="M405 193l-73 115a37 37 0 0 1-54 10l-58-43a15 15 0 0 0-18 0l-78 59c-10 8-24-5-17-16l73-115a37 37 0 0 1 54-10l58 43a15 15 0 0 0 18 0l78-59c10-8 24 5 17 16z" />
            </svg>
          </a>
          <a
            href={lineContactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#06C755] hover:bg-[#05b34c] text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center"
            title="ส่งข้อความผ่าน LINE"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629v-4.77c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.77zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629v-4.77c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24.411-.433.249-.235-.201-1.255-.82-1.755-1.135-.478-.326-.615-.872-.228-1.047.15-.174.39-.197.58-.095 1.756 1.03 3.27 1.684 4.675 2.073.442.121.847.182 1.216.182 4.42 0 8.05-3.66 8.05-8.131" />
            </svg>
          </a>
        </div>

        {/* Social Media — mobile: ปุ่มเดียว กดแล้วค่อยแสดงช่องทาง */}
        {isContactOpen && (
          <button
            type="button"
            aria-label="ปิดเมนูติดต่อ"
            className="md:hidden fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsContactOpen(false)}
          />
        )}
        <div className="md:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          <div
            className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${
              isContactOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-90 translate-y-4 pointer-events-none"
            }`}
          >
            <a
              href="https://www.facebook.com/violettobyforrfirst"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsContactOpen(false)}
              className="bg-blue-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
              title="Facebook"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href="https://m.me/violettobyforrfirst?text=รับรถแคชตามรายการนี้ครับ (ส่งรูปรายการที่บันทึกไว้ได้เลยครับ)"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsContactOpen(false)}
              className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center"
              title="Messenger"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6">
                <path fill="#0084FF" d="M256 8C119 8 8 119 8 256c0 72 29 137 76 180 8 7 7 12 8 58a20 20 0 0 0 30 18c53-23 54-25 63-22 153 32 320-66 320-234C504 119 393 8 256 8z" />
                <path fill="#fff" d="M405 193l-73 115a37 37 0 0 1-54 10l-58-43a15 15 0 0 0-18 0l-78 59c-10 8-24-5-17-16l73-115a37 37 0 0 1 54-10l58 43a15 15 0 0 0 18 0l78-59c10-8 24 5 17 16z" />
              </svg>
            </a>
            <a
              href={lineContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsContactOpen(false)}
              className="bg-[#06C755] text-white p-3 rounded-full shadow-lg flex items-center justify-center"
              title="LINE"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629v-4.77c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.77zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629v-4.77c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24.411-.433.249-.235-.201-1.255-.82-1.755-1.135-.478-.326-.615-.872-.228-1.047.15-.174.39-.197.58-.095 1.756 1.03 3.27 1.684 4.675 2.073.442.121.847.182 1.216.182 4.42 0 8.05-3.66 8.05-8.131" />
              </svg>
            </a>
          </div>
          <button
            type="button"
            onClick={() => setIsContactOpen((open) => !open)}
            aria-expanded={isContactOpen}
            aria-label={isContactOpen ? "ปิดช่องทางติดต่อ" : "เปิดช่องทางติดต่อ"}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
              isContactOpen
                ? "bg-gray-700 text-white rotate-0"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            }`}
          >
            {isContactOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Saved image preview modal */}
      {savedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSavedImage(null)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-md md:max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-2 text-center shrink-0">
              รูปรายการที่เลือก
            </h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* รูปเลื่อนดูได้ภายในกรอบ ส่วนปุ่มด้านล่างคงอยู่ตลอด */}
            <div className="min-h-0 overflow-y-auto rounded-lg border border-blue-100">
              <img
                src={savedImage.url}
                alt="รายการที่เลือก"
                className="w-full block"
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2 shrink-0">
              ถ้ากดบันทึกไม่ได้ (เช่น เปิดในแอป LINE/Facebook) ให้กดค้างที่รูปแล้วเลือก “บันทึกรูปภาพ”
            </p>
            <div className="flex gap-2 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setSavedImage(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-300"
              >
                ปิด
              </button>
              {canCopyImage && (
                <button
                  type="button"
                  onClick={copyImage}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-300"
                >
                  {copyStatus === "copied"
                    ? "✅ คัดลอกแล้ว"
                    : copyStatus === "failed"
                    ? "❌ คัดลอกไม่ได้"
                    : "📋 คัดลอกรูป"}
                </button>
              )}
              <a
                href={savedImage.url}
                download={savedImage.filename}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-semibold text-sm text-center transition-all duration-300"
              >
                💾 บันทึกรูป
              </a>
            </div>
          </div>
        </div>
      )}

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
