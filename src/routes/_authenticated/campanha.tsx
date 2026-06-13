import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { MessageCircle, CheckCircle2, RotateCcw, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/campanha")({
  component: CampanhaPage,
});

const CATALOG_URL =
  "https://figu.spiritrelay.com/public-catalog/b881921e-5a70-4df1-879e-d88dbb5b1628";

function buildMsg(nome: string) {
  return (
    `Olá, ${nome}!\n\n` +
    `Estamos *renovando o estoque* de figurinhas da Copa 2026!\n\n` +
    `Temos bastante disponível, aproveitem:\n\n` +
    `- *Posição 13* — Foto da Seleção\n` +
    `- *FWC* — Figurinhas da Copa\n` +
    `- *Seleções difíceis* de encontrar\n\n` +
    `Garante as suas antes que acabe:\n` +
    `${CATALOG_URL}\n\n` +
    `Qualquer dúvida é só chamar!`
  );
}

const CONTATOS = [
  { phone: "5515996200619", nome: "Odair" },
  { phone: "5515996409516", nome: "Gabriela" },
  { phone: "5515997233202", nome: "Patricia" },
  { phone: "5511911190688", nome: "Daniel" },
  { phone: "5511925358291", nome: "Diego" },
  { phone: "5511945484502", nome: "Gustavo" },
  { phone: "5511945828084", nome: "Larissa" },
  { phone: "5511947347488", nome: "Patricia" },
  { phone: "5511964831052", nome: "Aline" },
  { phone: "5511965064471", nome: "Fernando" },
  { phone: "5511967769398", nome: "Silas" },
  { phone: "5511972263375", nome: "Douglas" },
  { phone: "5511974226198", nome: "Marcelo" },
  { phone: "5511976510000", nome: "Renato" },
  { phone: "5511976919560", nome: "Katlin" },
  { phone: "5511976919568", nome: "Katlin" },
  { phone: "5511981111123", nome: "Eduardo" },
  { phone: "5511983457810", nome: "Agenor" },
  { phone: "5511992739114", nome: "Diego" },
  { phone: "5511996240861", nome: "Ana Claudia" },
  { phone: "5511997560622", nome: "Marcus" },
  { phone: "5511998028004", nome: "Carol" },
  { phone: "5511998177873", nome: "Cauo" },
  { phone: "5514981823979", nome: "Leandro" },
  { phone: "5514997904952", nome: "Alessandro" },
  { phone: "5515977099138", nome: "Marcos" },
  { phone: "5515981080809", nome: "Marina" },
  { phone: "5515981102810", nome: "Franciane" },
  { phone: "5515981111332", nome: "Heloisa" },
  { phone: "5515981112282", nome: "Galhego" },
  { phone: "5515981275083", nome: "Andressa" },
  { phone: "5515981327499", nome: "Pietra" },
  { phone: "5515981413139", nome: "Joao Pedro" },
  { phone: "5515981579103", nome: "Alana" },
  { phone: "5515981637675", nome: "Helen" },
  { phone: "5515988154413", nome: "Marcos" },
  { phone: "5515991020639", nome: "Ana" },
  { phone: "5515991055576", nome: "Pietro" },
  { phone: "5515991055579", nome: "Pietro" },
  { phone: "5515991084550", nome: "Arleivander" },
  { phone: "5515991128680", nome: "Leia" },
  { phone: "5515991203397", nome: "Marcelo" },
  { phone: "5515991247054", nome: "Junior" },
  { phone: "5515991294377", nome: "Rodrigo" },
  { phone: "5515991397771", nome: "Pedro Henrique" },
  { phone: "5515991460543", nome: "Edu" },
  { phone: "5515991467776", nome: "Kleber" },
  { phone: "5515991718062", nome: "Claudia" },
  { phone: "5515991831058", nome: "Joao" },
  { phone: "5515991895000", nome: "Leia" },
  { phone: "5515992017913", nome: "Leonardo" },
  { phone: "5515992458787", nome: "Pedro" },
  { phone: "5515994176216", nome: "Andre" },
  { phone: "5515996039821", nome: "Rafael" },
  { phone: "5515996049669", nome: "Claudio" },
  { phone: "5515996151944", nome: "Tawanni" },
  { phone: "5515996160665", nome: "Andressa" },
  { phone: "5515996192011", nome: "Murilo" },
  { phone: "5515996230962", nome: "Gisele" },
  { phone: "5515996245637", nome: "Allyson" },
  { phone: "5515996276766", nome: "Flavio" },
  { phone: "5515996290245", nome: "Priscila" },
  { phone: "5515996321628", nome: "Sankei" },
  { phone: "5515996367701", nome: "Joao Pedro" },
  { phone: "5515996376719", nome: "Eduardo" },
  { phone: "5515996480178", nome: "Leonardo" },
  { phone: "5515996487168", nome: "Pedro" },
  { phone: "5515996490571", nome: "Luiz" },
  { phone: "5515996587994", nome: "Glauber" },
  { phone: "5515996620096", nome: "Marilia" },
  { phone: "5515996622223", nome: "Andre" },
  { phone: "5515996688770", nome: "Felipe" },
  { phone: "5515996775135", nome: "Felipe" },
  { phone: "5515996841509", nome: "Tiago" },
  { phone: "5515996881332", nome: "Edineu" },
  { phone: "5515996929143", nome: "Roger" },
  { phone: "5515997000582", nome: "Igor" },
  { phone: "5515997072545", nome: "Eduardo" },
  { phone: "5515997099138", nome: "Marcos" },
  { phone: "5515997176216", nome: "Andre" },
  { phone: "5515997209488", nome: "Rafael" },
  { phone: "5515997213290", nome: "Robson" },
  { phone: "5515997219352", nome: "Peterson" },
  { phone: "5515997221095", nome: "Jessica" },
  { phone: "5515997269041", nome: "Pedro" },
  { phone: "5515997342922", nome: "Juliana" },
  { phone: "5515997404029", nome: "Eduardo" },
  { phone: "5515997419044", nome: "Tiago" },
  { phone: "5515997440097", nome: "Regina" },
  { phone: "5515997450254", nome: "Luis Ricardo" },
  { phone: "5515997451834", nome: "Eudes" },
  { phone: "5515997468252", nome: "Ben Hur" },
  { phone: "5515998403416", nome: "Parceiro" },
];

type Filter = "todos" | "pendentes" | "enviados";

function CampanhaPage() {
  const [sent, setSent] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("campanha_sent") ?? "{}");
    } catch {
      return {};
    }
  });
  const [filter, setFilter] = useState<Filter>("todos");
  const [search, setSearch] = useState("");

  const total = CONTATOS.length;
  const sentCount = Object.keys(sent).length;
  const pct = total > 0 ? (sentCount / total) * 100 : 0;

  function toggle(phone: string) {
    setSent((prev) => {
      const next = { ...prev };
      if (next[phone]) delete next[phone];
      else next[phone] = true;
      localStorage.setItem("campanha_sent", JSON.stringify(next));
      return next;
    });
  }

  function resetAll() {
    if (!confirm("Resetar progresso de todos?")) return;
    setSent({});
    localStorage.setItem("campanha_sent", "{}");
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CONTATOS.filter((c) => {
      const matchSearch = !q || c.nome.toLowerCase().includes(q) || c.phone.includes(q);
      const isSent = !!sent[c.phone];
      const matchFilter =
        filter === "todos" ||
        (filter === "enviados" && isSent) ||
        (filter === "pendentes" && !isSent);
      return matchSearch && matchFilter;
    });
  }, [search, filter, sent]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">📱 Campanha WhatsApp</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Renovação de estoque — {total} contatos</p>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Resetar
        </button>
      </div>

      {/* Progresso */}
      <div
        className="rounded-xl p-4 space-y-2"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Progresso</span>
          <span className="font-semibold" style={{ color: "#a78bfa" }}>
            {sentCount} / {total} enviados
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1e1b4b" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
            }}
          />
        </div>
      </div>

      {/* Filtros + Busca */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-1.5">
          {(["todos", "pendentes", "enviados"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={{
                background: filter === f ? "#7c3aed" : "rgba(255,255,255,0.04)",
                color: filter === f ? "#fff" : "#a1a1aa",
                border: filter === f ? "1px solid #7c3aed" : "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {f === "enviados" ? "Enviados ✅" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou número..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#e0e0e0",
            }}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-zinc-600 text-sm">Nenhum contato encontrado</div>
        )}
        {filtered.map((c) => {
          const isSent = !!sent[c.phone];
          const initials = c.nome.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
          const phoneFormatted = c.phone.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "+55 ($1) $2-$3");
          const waLink = `https://wa.me/${c.phone}?text=${encodeURIComponent(buildMsg(c.nome))}`;

          return (
            <div
              key={c.phone}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
              style={{
                background: isSent ? "rgba(5,46,22,0.5)" : "rgba(255,255,255,0.03)",
                border: isSent ? "1px solid #166534" : "1px solid rgba(255,255,255,0.06)",
                opacity: isSent ? 0.7 : 1,
              }}
            >
              {/* Avatar */}
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{
                  background: isSent
                    ? "#166534"
                    : "linear-gradient(135deg, #7c3aed, #a78bfa)",
                }}
              >
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{c.nome}</div>
                <div className="text-xs text-zinc-500">{phoneFormatted}</div>
              </div>

              {/* Enviado badge */}
              {isSent && (
                <span className="text-xs font-semibold text-green-400 hidden sm:block">✅ Enviado</span>
              )}

              {/* Botão WhatsApp */}
              {!isSent && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setTimeout(() => toggle(c.phone), 1500)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black transition-all shrink-0"
                  style={{ background: "#25d366" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1fba58")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#25d366")}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Enviar
                </a>
              )}

              {/* Toggle enviado */}
              <button
                onClick={() => toggle(c.phone)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all shrink-0"
                style={{
                  background: "transparent",
                  border: isSent ? "1px solid #166534" : "1px solid rgba(255,255,255,0.08)",
                  color: isSent ? "#22c55e" : "#71717a",
                }}
              >
                {isSent ? (
                  <><RotateCcw className="h-3 w-3" /> Desfazer</>
                ) : (
                  <><CheckCircle2 className="h-3 w-3" /> Marcar</>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
