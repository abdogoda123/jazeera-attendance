"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, ArrowRight, Lock, LogOut, MapPin, RefreshCw, FileText, Users, Calendar, Code2, Award, Download, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const validPasswords = Array.from({ length: 20 }, (_, i) => `pwd${i + 1}`);

interface AttendanceRecord {
  id: string;
  name: string;
  studentId: string;
  department: string;
  level: string;
  subject: string;
  doctor: string;
  timestamp: string;
  date: string;
}

export default function DoctorPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [doctorName, setDoctorName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [allowedDistance, setAllowedDistance] = useState("100");
  const [doctorLocation, setDoctorLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [sessionActive, setSessionActive] = useState(false);
  const [dynamicCode, setDynamicCode] = useState("");
  const [timer, setTimer] = useState(15);

  const [activeTab, setActiveTab] = useState<"qr" | "reports">("reports"); // افتراضياً يفتح على التقارير لتراها فوراً
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [filterDepartment, setFilterDepartment] = useState("الكل");

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (username.trim() === "admin" && validPasswords.includes(password.trim())) {
      setIsAuthenticated(true);
      setErrorMsg("");
      loadAttendanceRecords();
    } else {
      setErrorMsg("اسم المستخدم أو كلمة المرور غير صحيحة!");
    }
  }

  function loadAttendanceRecords() {
    const saved = localStorage.getItem("jazeera_attendance");
    if (saved) {
      try {
        setAttendanceList(JSON.parse(saved));
      } catch {
        setAttendanceList([]);
      }
    }
  }

  function clearRecords() {
    if (confirm("هل أنت تأكد من مسح جميع سجلات الحضور؟")) {
      localStorage.removeItem("jazeera_attendance");
      setAttendanceList([]);
    }
  }

  function getDoctorGPS() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDoctorLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert("تعذر الحصول على موقع الـ GPS. تأكد من تفعيله.")
      );
    }
  }

  function startSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!doctorName || !subjectName) return;
    const location = doctorLocation || { lat: 30.0444, lng: 31.2357 };
    if (!doctorLocation) setDoctorLocation(location);
    setSessionActive(true);
    generateNewQR(location);
  }

  function generateNewQR(loc: { lat: number; lng: number }) {
    const timestamp = Math.floor(Date.now() / 15000);
    const data = {
      doctor: doctorName,
      subject: subjectName,
      lat: loc.lat,
      lng: loc.lng,
      radius: allowedDistance,
      t: timestamp
    };
    setDynamicCode(JSON.stringify(data));
    setTimer(15);
  }

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive && doctorLocation) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            generateNewQR(doctorLocation);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, doctorLocation, doctorName, subjectName, allowedDistance]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAttendanceRecords();
      const interval = setInterval(loadAttendanceRecords, 2000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const filteredRecords = attendanceList.filter((item) => {
    return filterDepartment === "الكل" ? true : item.department === filterDepartment;
  });

  return (
    <main dir="rtl" className="min-h-screen bg-[#031326] px-4 py-8 text-white flex flex-col justify-between">
      <div className="mx-auto max-w-4xl w-full">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-sky-300 hover:text-white">
          <ArrowRight size={18} /> الرئيسية
        </Link>

        <header className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sky-400">
              <GraduationCap size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">بوابة الدكتور — لوحة الحضور والتقارير</h1>
              <p className="mt-1 text-sm text-slate-400">أكاديمية الجزيرة العالية للهندسة والتكنولوجيا الحديثة</p>
            </div>
          </div>
          {isAuthenticated && (
            <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-2 rounded-xl bg-rose-600/20 border border-rose-500/30 px-4 py-2 text-xs text-rose-300 hover:bg-rose-600/30">
              <LogOut size={16} /> خروج
            </button>
          )}
        </header>

        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="space-y-5 rounded-2xl border border-sky-900 bg-[#061c32] p-6 max-w-lg mx-auto shadow-2xl">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Lock className="text-sky-400" /> تسجيل دخول الدكتور</h2>
            <div>
              <label className="mb-2 block text-sm text-slate-300">اسم المستخدم</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full rounded-xl border border-sky-900 bg-[#031326] px-4 py-3 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">كلمة المرور</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full rounded-xl border border-sky-900 bg-[#031326] px-4 py-3 outline-none" />
            </div>
            <button type="submit" className="w-full rounded-xl bg-blue-600 py-3 font-bold hover:bg-blue-500 transition">دخول لوحة التحكم</button>
            {errorMsg && <p className="text-sm text-rose-400">{errorMsg}</p>}
          </form>
        ) : (
          <div className="space-y-6">
            {/* أزرار التنقل الرئيسية بين توليد الباركود والتقارير */}
            <div className="flex gap-3 border-b border-sky-900 pb-4">
              <button
                onClick={() => setActiveTab("reports")}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition ${activeTab === "reports" ? "bg-emerald-600 text-white shadow-lg" : "bg-[#061c32] text-slate-400 hover:text-white border border-sky-900"}`}
              >
                <FileText size={18} /> سجلات الحضور والتقارير ({attendanceList.length})
              </button>
              <button
                onClick={() => setActiveTab("qr")}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition ${activeTab === "qr" ? "bg-sky-600 text-white shadow-lg" : "bg-[#061c32] text-slate-400 hover:text-white border border-sky-900"}`}
              >
                <RefreshCw size={18} /> توليد باركود QR المحاضرة
              </button>
            </div>

            {activeTab === "reports" ? (
              /* قسم تقارير الحضور */
              <div className="space-y-6 rounded-2xl border border-sky-900 bg-[#061c32] p-6 shadow-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-sky-900/60 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2"><Users size={20} /> كشف الحضور المباشر</h3>
                    <p className="text-xs text-slate-400 mt-1">يتم تحديث الطلاب الحاضرين تلقائياً بمجرد مسحهم للـ QR</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      className="rounded-xl border border-sky-900 bg-[#031326] px-3 py-2 outline-none text-xs text-white"
                    >
                      <option value="الكل">جميع الأقسام</option>
                      <option value="هندسة الاتصالات والإلكترونيات">هندسة الاتصالات والإلكترونيات</option>
                      <option value="الهندسة المدنية">الهندسة المدنية</option>
                      <option value="الهندسة المعمارية">الهندسة المعمارية</option>
                      <option value="إعدادي علوم أساسية">إعدادي علوم أساسية</option>
                    </select>

                    {attendanceList.length > 0 && (
                      <button onClick={clearRecords} className="flex items-center gap-1 rounded-xl bg-rose-600/20 border border-rose-500/30 px-3 py-2 text-xs text-rose-300 hover:bg-rose-600/30">
                        <Trash2 size={14} /> مسح الكشف
                      </button>
                    )}
                  </div>
                </div>

                {filteredRecords.length === 0 ? (
                  <div className="text-center py-12 rounded-xl bg-[#031326] border border-sky-900/60 text-slate-400 text-sm">
                    لا توجد أسماء مسجلة حالياً. افتح بوابة الطالب في تبويب آخر وسجل حضورك لتظهر هنا مباشرة!
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-sky-900">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-[#031326] text-sky-300 text-xs uppercase border-b border-sky-900">
                        <tr>
                          <th className="p-3">م</th>
                          <th className="p-3">اسم الطالب</th>
                          <th className="p-3">الرقم الجامعي (ID)</th>
                          <th className="p-3">القسم</th>
                          <th className="p-3">المستوى</th>
                          <th className="p-3">المادة</th>
                          <th className="p-3">تاريخ ووقت الحضور</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sky-900/40 text-slate-200 text-xs">
                        {filteredRecords.map((rec, index) => (
                          <tr key={rec.id || index} className="hover:bg-sky-500/5 transition">
                            <td className="p-3 text-slate-500">{index + 1}</td>
                            <td className="p-3 font-bold text-white">{rec.name}</td>
                            <td className="p-3 font-mono text-sky-400">{rec.studentId}</td>
                            <td className="p-3">{rec.department}</td>
                            <td className="p-3">{rec.level}</td>
                            <td className="p-3 font-bold text-emerald-400">{rec.subject}</td>
                            <td className="p-3 text-slate-400 flex items-center gap-1"><Calendar size={13} /> {rec.date} — {rec.timestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* قسم توليد الـ QR */
              <div className="space-y-6">
                {!sessionActive ? (
                  <form onSubmit={startSession} className="space-y-5 rounded-2xl border border-sky-900 bg-[#061c32] p-6 shadow-2xl">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">اسم الدكتور</label>
                      <input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="مثال: د. أحمد" required className="w-full rounded-xl border border-sky-900 bg-[#031326] px-4 py-3 outline-none" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">اسم المادة</label>
                      <input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="مثال: اتصالات رقمية" required className="w-full rounded-xl border border-sky-900 bg-[#031326] px-4 py-3 outline-none" />
                    </div>

                    <div className="rounded-xl border border-sky-800 bg-[#031326] p-4 flex items-center justify-between">
                      <div className="text-xs">
                        <p className="font-bold text-sky-300">موقع القاعة (GPS):</p>
                        <p className="text-slate-400 mt-1">{doctorLocation ? "تم تحديد الموقع بنجاح" : "اختياري (سيتم ضبطه تلقائياً)"}</p>
                      </div>
                      <button type="button" onClick={getDoctorGPS} className="flex items-center gap-1 rounded-xl bg-sky-500/20 border border-sky-400/30 px-3 py-2 text-xs text-sky-300">
                        <MapPin size={16} /> تحديد الموقع
                      </button>
                    </div>

                    <button type="submit" className="w-full rounded-xl bg-emerald-600 py-3 font-bold hover:bg-emerald-500 transition">
                      بدء المحاضرة وتوليد الباركود
                    </button>
                  </form>
                ) : (
                  <div className="text-center rounded-2xl border border-sky-500/40 bg-sky-500/10 p-6 flex flex-col items-center justify-center shadow-2xl">
                    <h3 className="text-xl font-bold text-sky-300">{subjectName} ({doctorName})</h3>
                    
                    <div className="bg-white p-5 rounded-2xl shadow-xl my-4">
                      <QRCodeSVG value={dynamicCode} size={220} />
                    </div>

                    <div className="flex items-center justify-center gap-2 text-amber-400 text-sm font-bold">
                      <RefreshCw size={18} className="animate-spin" /> يتجدد الـ QR خلال: {timer} ثوانٍ
                    </div>

                    <button onClick={() => setSessionActive(false)} className="mt-6 rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold hover:bg-rose-500">
                      إنهـاء المحاضرة
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* كارت الحقوق والتصميم باسم الطالب عبدالرحمن جودة منصور */}
      <footer className="mt-12 mx-auto max-w-4xl w-full">
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