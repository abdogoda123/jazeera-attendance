"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { GraduationCap, UserRound, ArrowRight, MapPin, CheckCircle, AlertTriangle, Camera, Code2, Award } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function StudentPage() {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("هندسة الاتصالات والإلكترونيات");
  const [level, setLevel] = useState("الثاني");
  
  const [studentLocation, setStudentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setStudentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setStudentLocation({ lat: 30.0444, lng: 31.2357 })
      );
    } else {
      setStudentLocation({ lat: 30.0444, lng: 31.2357 });
    }
  }, []);

  useEffect(() => {
    let qrCodeInstance: Html5Qrcode | null = null;

    if (isCameraActive) {
      setTimeout(() => {
        qrCodeInstance = new Html5Qrcode("reader");
        html5QrCodeRef.current = qrCodeInstance;

        qrCodeInstance
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              verifyAttendance(decodedText);
              qrCodeInstance?.stop().catch(() => {});
              setIsCameraActive(false);
            },
            () => {}
          )
          .catch((err) => {
            console.error("Camera start error:", err);
            setStatusMessage({ type: "error", text: "تعذر فتح الكاميرا. تأكد من إعطاء الصلاحية للمتصفح." });
            setIsCameraActive(false);
          });
      }, 100);
    }

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [isCameraActive]);

  function verifyAttendance(qrDataText: string) {
    if (!name || !studentId) {
      setStatusMessage({ type: "error", text: "يرجى كتابة اسم الطالب ورقمك الجامعي أولاً!" });
      return;
    }

    try {
      const qrData = JSON.parse(qrDataText);
      const currentTimestamp = Math.floor(Date.now() / 15000);

      if (Math.abs(currentTimestamp - qrData.t) > 3) {
        setStatusMessage({ type: "error", text: "عذراً! انتهت صلاحية رمز الـ QR (رمز قديم). انتظر الرمز الجديد المتجدد." });
        return;
      }

      if (!studentLocation) {
        setStatusMessage({ type: "error", text: "جاري تحديد موقع الـ GPS..." });
        return;
      }

      const distance = calculateDistance(studentLocation.lat, studentLocation.lng, qrData.lat, qrData.lng);
      const maxAllowed = parseFloat(qrData.radius || "100");

      if (distance > maxAllowed) {
        setStatusMessage({ type: "error", text: `فشل الحضور! أنت خارج نطاق القاعة (المسافة: ${Math.round(distance)} متر — المسموح: ${maxAllowed} متر).` });
        return;
      }

      // حفظ سجل الحضور مع ربطه بيوزرنيم الدكتور الخاص به لضمان العزل والخصوصية
      const newRecord = {
        id: Date.now().toString(),
        name,
        studentId,
        department,
        level,
        subject: qrData.subject,
        doctor: qrData.doctor,
        doctorUsername: qrData.doctorUsername || "admin",
        timestamp: new Date().toLocaleTimeString('ar-EG'),
        date: new Date().toLocaleDateString('ar-EG'),
      };

      const existing = JSON.parse(localStorage.getItem("jazeera_attendance") || "[]");
      localStorage.setItem("jazeera_attendance", JSON.stringify([newRecord, ...existing]));

      setStatusMessage({
        type: "success",
        text: `تم تسجيل حضورك بنجاح تام يا ${name}! في مادة (${qrData.subject}) للدكتور (${qrData.doctor}).`
      });

    } catch {
      setStatusMessage({ type: "error", text: "رمز QR غير صالح أو غير معتمد من النظام!" });
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#031326] px-4 py-8 text-white flex flex-col justify-between">
      <div className="mx-auto max-w-2xl w-full">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-sky-300 hover:text-white">
          <ArrowRight size={18} /> الرئيسية
        </Link>

        <header className="mb-7 flex items-center gap-4">
          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sky-400">
            <GraduationCap size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">بوابة الطالب — مسح الـ QR المباشر</h1>
            <p className="mt-1 text-sm text-slate-400">أكاديمية الجزيرة العالية للهندسة والتكنولوجيا الحديثة</p>
          </div>
        </header>

        <div className="space-y-5 rounded-2xl border border-sky-900 bg-[#061c32] p-6 shadow-2xl">
          <h2 className="flex items-center gap-2 text-lg font-bold"><UserRound className="text-sky-400" /> بيانات الطالب</h2>
          
          <div>
            <label className="mb-2 block text-sm text-slate-300">اسم الطالب بالكامل</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اكتب اسمك هنا" required className="w-full rounded-xl border border-sky-900 bg-[#031326] px-4 py-3 outline-none" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">الرقم الجامعي (ID)</label>
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="اكتب الرقم الجامعي" required className="w-full rounded-xl border border-sky-900 bg-[#031326] px-4 py-3 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">القسم</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-xl border border-sky-900 bg-[#031326] px-4 py-2.5 outline-none text-sm">
                <option>هندسة الاتصالات والإلكترونيات</option>
                <option>الهندسة المدنية</option>
                <option>الهندسة المعمارية</option>
                <option>إعدادي علوم أساسية</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">المستوى</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full rounded-xl border border-sky-900 bg-[#031326] px-4 py-2.5 outline-none text-sm">
                <option>الأول</option>
                <option>الثاني</option>
                <option>الثالث</option>
                <option>الرابع</option>
                <option>الخامس</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-sky-800 bg-[#031326] p-4 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-sky-300">حالة موقعك الجغرافي (GPS):</p>
              <p className="text-slate-400 mt-1">{studentLocation ? "تم رصد موقعك بدقة داخل النطاق" : "جاري تحديد الموقع..."}</p>
            </div>
            <MapPin className="text-emerald-400" size={22} />
          </div>

          <div className="pt-2">
            <button 
              type="button"
              onClick={() => {
                if (!name || !studentId) {
                  setStatusMessage({ type: "error", text: "يرجى كتابة اسمك ورقمك الجامعي أولاً قبل فتح الكاميرا!" });
                  return;
                }
                setIsCameraActive(!isCameraActive);
              }} 
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold hover:bg-blue-500 transition shadow-lg text-base"
            >
              <Camera size={22} /> {isCameraActive ? "إغلاق الكاميرا" : "فتح الكاميرا المباشرة لمسح باركود الدكتور"}
            </button>
          </div>

          {isCameraActive && (
            <div className="mt-4 rounded-2xl bg-black p-3 shadow-inner border border-sky-500/40">
              <div id="reader" className="w-full rounded-xl overflow-hidden"></div>
              <p className="text-center text-xs text-sky-300 mt-2">جاري تشغيل كاميرا الجهاز لقراءة الـ QR الفوري...</p>
            </div>
          )}

          {statusMessage && (
            <div className={`p-4 rounded-xl border text-sm leading-6 ${statusMessage.type === "success" ? "bg-emerald-950/60 border-emerald-600 text-emerald-200" : "bg-rose-950/60 border-rose-600 text-rose-200"}`}>
              {statusMessage.type === "success" ? <CheckCircle className="inline ml-2" size={18} /> : <AlertTriangle className="inline ml-2" size={18} />}
              {statusMessage.text}
            </div>
          )}
        </div>
      </div>

      <footer className="mt-12 mx-auto max-w-2xl w-full">
        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/70 via-[#061c32] to-sky-950/70 p-5 shadow-xl backdrop-blur-md text-center">
          <div className="flex items-center justify-center gap-2 text-sky-400 text-sm font-semibold mb-1">
            <Code2 size={18} />
            <span>إعداد وتصميم طالب / <strong className="text-white font-bold text-base">عبدالرحمن جودة منصور</strong></span>
            <Award size={18} className="text-amber-400" />
          </div>
          <p className="text-xs text-slate-300">
            قسم هندسة الاتصالات والألكترونيات — المستوي الثاني
          </p>
        </div>
      </footer>
    </main>
  );
}