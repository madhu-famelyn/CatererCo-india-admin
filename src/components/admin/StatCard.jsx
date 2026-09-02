import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
export function StatCard({ label, value, icon: Icon, trend, spark, accent = "primary", to }) {
    const accentClass = accent === "emerald"
        ? "text-emerald-400 bg-emerald-500/10"
        : accent === "amber"
            ? "text-amber-400 bg-amber-500/10"
            : accent === "rose"
                ? "text-rose-400 bg-rose-500/10"
                : "text-primary bg-primary/15";
    const path = spark && spark.length > 1 ? buildSparkPath(spark, 120, 36) : null;

    const content = (
      <Card className="group relative overflow-hidden border-white/5 bg-card/60 backdrop-blur transition-all hover:border-primary/40 hover:shadow-[0_0_40px_-12px_var(--color-primary)] hover:scale-[1.01] cursor-pointer">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100"/>
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground group-hover:text-primary transition-colors">
                {label}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
              {trend && (<p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <ArrowUpRight className="h-3 w-3"/>
                  {trend}
                </p>)}
            </div>
            <div className={`rounded-xl p-2.5 ${accentClass}`}>
              <Icon className="h-4 w-4"/>
            </div>
          </div>
          {path && (<svg viewBox="0 0 120 36" preserveAspectRatio="none" className="mt-3 h-9 w-full text-primary">
              <defs>
                <linearGradient id={`sp-${label.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d={path.area} fill={`url(#sp-${label.replace(/\s+/g, "")})`}/>
              <path d={path.line} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 4px currentColor)" }}/>
            </svg>)}
        </CardContent>
      </Card>
    );

    return to ? <Link to={to} className="block">{content}</Link> : content;
}
function buildSparkPath(values, w, h) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = w / (values.length - 1);
    const points = values.map((v, i) => {
        const x = i * step;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return [x, y];
    });
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L${w},${h} L0,${h} Z`;
    return { line, area };
}
