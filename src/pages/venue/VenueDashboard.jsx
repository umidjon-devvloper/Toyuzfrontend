import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { Layout } from "../../components/UI";
import FloatingHearts from "../../components/FloatingHearts";
import { Mails, CalendarHeart, CheckCircle2, Plus, Heart, Sparkles, ArrowRight, MapPin } from "lucide-react";

const isUpcoming = (d) => new Date(d) >= new Date(new Date().toDateString());

export default function VenueDashboard() {
  const [stats, setStats] = useState(null);
  const [list, setList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/venue/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/venue/invitations").then((r) => setList(r.data)).catch(() => {});
  }, []);

  const finished = list.filter((i) => !isUpcoming(i.weddingDate)).length;
  const recent = list.slice(0, 5);

  const cards = [
    { Icon: Mails, label: "Jami taklifnomalar", value: stats?.total, sub: "Yaratilgan", grad: "from-gold-400 to-gold-600" },
    { Icon: CalendarHeart, label: "Umumiy to'ylar", value: list.length, sub: "Barcha to'ylar", grad: "from-rose-400 to-rose-600" },
    { Icon: CheckCircle2, label: "Tugagan to'ylar", value: finished, sub: "O'tib bo'lgan", grad: "from-emerald-400 to-emerald-600" },
  ];

  return (
    <Layout title="Boshqaruv paneli">
      {/* Premium fon: nozik gradient + suzuvchi yurakchalar */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-gold-50 via-white to-gold-100" />
      <FloatingHearts count={14} />

      <div className="relative z-10 animate-fadeUp">
        {/* ===== Premium hero ===== */}
        <div className="relative overflow-hidden rounded-3xl p-7 sm:p-9 mb-6 shadow-premium
                        bg-gradient-to-br from-[#3a2a17] via-[#5d3a23] to-[#875328] text-white">
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-gold-300/20 blur-3xl" />
          <div className="absolute -left-8 -bottom-12 w-52 h-52 rounded-full bg-rose-300/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 text-gold-200 text-xs font-semibold tracking-widest uppercase mb-3">
              <Sparkles size={15} /> Premium taklifnoma paneli
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
              <span className="gold-shimmer-text">Sevgi tarixini</span> chiroyli boshlang
            </h2>
            <p className="text-white/70 mt-2 max-w-md text-sm sm:text-base">
              Bir necha qadamda zamonaviy raqamli to'y taklifnomasini yarating va darhol yuboring.
            </p>
            <button
              onClick={() => navigate("/venue/invitations")}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white text-gold-800 font-semibold
                         px-6 py-3 shadow-gold hover:scale-[1.03] active:scale-95 transition-transform"
            >
              <Plus size={18} /> Yangi taklifnoma <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* ===== Statistika kartalari ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {cards.map((c) => (
            <div key={c.label}
              className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur
                         border border-gold-100 p-5 shadow-premium hover:-translate-y-1 transition-transform">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3
                              bg-gradient-to-br ${c.grad} text-white shadow-lg`}>
                <c.Icon size={22} />
              </div>
              <div className="text-3xl font-extrabold text-gold-900">{c.value ?? "—"}</div>
              <div className="text-sm font-semibold text-gold-800 mt-0.5">{c.label}</div>
              <div className="text-xs text-gold-500">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* ===== So'nggi taklifnomalar ===== */}
        <div className="rounded-2xl bg-white/85 backdrop-blur border border-gold-100 shadow-premium overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gold-100">
            <h3 className="font-serif text-lg font-bold text-gold-900 flex items-center gap-2">
              <Heart size={18} className="text-rose-500" /> So'nggi taklifnomalar
            </h3>
            <button onClick={() => navigate("/venue/invitations")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-900">
              <Plus size={15} /> Qo'shish
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="py-12 text-center text-gold-500">
              <CalendarHeart size={34} className="mx-auto mb-2 opacity-50" />
              Hali taklifnoma yo'q. Birinchisini yarating.
            </div>
          ) : (
            <div className="divide-y divide-gold-50">
              {recent.map((inv) => (
                <div key={inv._id} className="flex items-center gap-3 px-5 py-3 hover:bg-gold-50/60 transition-colors">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-gold-100 flex items-center justify-center shrink-0">
                    {inv.images?.[0]
                      ? <img src={inv.images[0]} alt="" className="w-full h-full object-cover" />
                      : <Heart size={18} className="text-gold-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gold-900 truncate">{inv.groomName} & {inv.brideName}</div>
                    <div className="text-xs text-gold-500 flex items-center gap-1 truncate">
                      <MapPin size={12} /> {inv.venueName || inv.address || "—"}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-gold-800">
                      {new Date(inv.weddingDate).toLocaleDateString("uz")}
                    </div>
                    <div className="text-xs text-gold-400">{inv.weddingTime}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
