"use client";

import {
  Activity,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  MapPin,
  Orbit,
  Play,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { AspectData, ChartRequest, ChartResponse, PlanetData, postChart } from "@/lib/api";

const planetGlyphs: Record<string, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mercury: "Me",
  Venus: "Ve",
  Mars: "Ma",
  Jupiter: "Ju",
  Saturn: "Sa"
};

const planetColors: Record<string, string> = {
  Sun: "#d8952a",
  Moon: "#7e8f9a",
  Mercury: "#146c65",
  Venus: "#b65f42",
  Mars: "#9f3145",
  Jupiter: "#486c9a",
  Saturn: "#61523d"
};

const zodiac = [
  "Ar",
  "Ta",
  "Ge",
  "Cn",
  "Le",
  "Vi",
  "Li",
  "Sc",
  "Sg",
  "Cp",
  "Aq",
  "Pi"
];

const defaultPayload: ChartRequest = {
  birth_date: "1990-06-15",
  birth_time: "08:30:00+05:30",
  birth_lat: 26.8467,
  birth_lng: 80.9462
};

export function ChartWorkbench() {
  const [payload, setPayload] = useState<ChartRequest>(defaultPayload);
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMath, setShowMath] = useState(true);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      setChart(await postChart(payload));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chart request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  const totalTension = useMemo(() => {
    if (!chart) {
      return 0;
    }

    return chart.aspects.reduce((total, aspect) => total + aspect.tension_score, 0);
  }, [chart]);

  return (
    <div className="workbench">
      <header className="workbench-hero">
        <div>
          <p className="eyebrow">Transparent astrology engine</p>
          <h1>COSMIQ chart lab</h1>
        </div>
        <div className="hero-actions">
          <button
            className="icon-button"
            type="button"
            aria-label={showMath ? "Hide math" : "Show math"}
            title={showMath ? "Hide math" : "Show math"}
            onClick={() => setShowMath((value) => !value)}
          >
            {showMath ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </header>

      <section className="workbench-grid">
        <form className="control-panel panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Birth input</p>
              <h2>Natal coordinates</h2>
            </div>
            <ShieldCheck size={20} />
          </div>

          <label className="field">
            <span>
              <CalendarDays size={16} />
              Date
            </span>
            <input
              required
              type="date"
              value={payload.birth_date}
              onChange={(event) => setPayload({ ...payload, birth_date: event.target.value })}
            />
          </label>

          <label className="field">
            <span>
              <Activity size={16} />
              Time with offset
            </span>
            <input
              required
              value={payload.birth_time}
              placeholder="08:30:00+05:30"
              onChange={(event) => setPayload({ ...payload, birth_time: event.target.value })}
            />
          </label>

          <div className="split-fields">
            <label className="field">
              <span>
                <MapPin size={16} />
                Latitude
              </span>
              <input
                required
                inputMode="decimal"
                value={payload.birth_lat}
                onChange={(event) =>
                  setPayload({ ...payload, birth_lat: Number(event.target.value) })
                }
              />
            </label>
            <label className="field">
              <span>
                <MapPin size={16} />
                Longitude
              </span>
              <input
                required
                inputMode="decimal"
                value={payload.birth_lng}
                onChange={(event) =>
                  setPayload({ ...payload, birth_lng: Number(event.target.value) })
                }
              />
            </label>
          </div>

          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="spin" size={18} /> : <Play size={18} />}
            Calculate chart
          </button>

          {error ? <p className="alert">{error}</p> : null}
        </form>

        <section className="chart-stage panel">
          <div className="stage-topline">
            <div>
              <p className="eyebrow">Live geometry</p>
              <h2>{chart ? chart.nakshatra.moon_nakshatra : "Awaiting chart"}</h2>
            </div>
            <ScoreDial score={totalTension} />
          </div>

          <ChartWheel chart={chart} loading={isLoading} />
        </section>

        <section className="insight-panel panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Aspects</p>
              <h2>{chart ? `${chart.aspects.length} active` : "Ready"}</h2>
            </div>
            <Orbit size={20} />
          </div>

          <div className="aspect-list">
            {chart ? (
              chart.aspects.length ? (
                chart.aspects.map((aspect, index) => (
                  <AspectRow
                    aspect={aspect}
                    key={`${aspect.planet_1}-${aspect.planet_2}-${aspect.name}`}
                    showMath={showMath}
                    index={index}
                  />
                ))
              ) : (
                <EmptyState />
              )
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

function ChartWheel({ chart, loading }: { chart: ChartResponse | null; loading: boolean }) {
  const planets = chart ? Object.entries(chart.planets) : [];

  return (
    <div className={`wheel-wrap ${loading ? "is-loading" : ""}`}>
      <svg className="chart-wheel" viewBox="0 0 420 420" role="img" aria-label="Birth chart wheel">
        <defs>
          <filter id="softShadow">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#2c2318" floodOpacity="0.18" />
          </filter>
        </defs>

        <circle className="wheel-outer" cx="210" cy="210" r="184" />
        <circle className="wheel-middle" cx="210" cy="210" r="142" />
        <circle className="wheel-inner" cx="210" cy="210" r="72" />

        {zodiac.map((sign, index) => {
          const position = polarToCartesian(index * 30 + 15, 166);
          return (
            <text className="zodiac-label" key={sign} x={position.x} y={position.y}>
              {sign}
            </text>
          );
        })}

        {Array.from({ length: 12 }).map((_, index) => {
          const start = polarToCartesian(index * 30, 72);
          const end = polarToCartesian(index * 30, 184);
          return (
            <line
              className="wheel-spoke"
              key={index}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
            />
          );
        })}

        {planets.map(([name, planet], index) => (
          <PlanetMarker index={index} key={name} name={name} planet={planet} />
        ))}

        {chart?.aspects.slice(0, 8).map((aspect, index) => {
          const planetA = chart.planets[aspect.planet_1];
          const planetB = chart.planets[aspect.planet_2];
          if (!planetA || !planetB) {
            return null;
          }

          const start = polarToCartesian(planetA.longitude, 118);
          const end = polarToCartesian(planetB.longitude, 118);
          return (
            <line
              className={`aspect-line ${aspect.tension_score > 0 ? "tense" : "flow"}`}
              key={`${aspect.planet_1}-${aspect.planet_2}-${index}`}
              style={{ animationDelay: `${index * 110}ms` }}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
            />
          );
        })}
      </svg>
    </div>
  );
}

function PlanetMarker({
  index,
  name,
  planet
}: {
  index: number;
  name: string;
  planet: PlanetData;
}) {
  const position = polarToCartesian(planet.longitude, 118);
  const label = polarToCartesian(planet.longitude, 202);

  return (
    <g className="planet-marker" style={{ animationDelay: `${index * 90}ms` }}>
      <circle
        cx={position.x}
        cy={position.y}
        fill={planetColors[name] ?? "#151413"}
        r="8"
      />
      <text className="planet-label" x={label.x} y={label.y}>
        {planetGlyphs[name] ?? name.slice(0, 2)}
      </text>
    </g>
  );
}

function AspectRow({
  aspect,
  index,
  showMath
}: {
  aspect: AspectData;
  index: number;
  showMath: boolean;
}) {
  const tense = aspect.tension_score > 0;

  return (
    <article className="aspect-row" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="aspect-row-top">
        <span className={`aspect-badge ${tense ? "tense" : "flow"}`}>{aspect.name}</span>
        <span className="aspect-planets">
          {aspect.planet_1} / {aspect.planet_2}
        </span>
        <span className="aspect-score">{aspect.tension_score > 0 ? "+" : ""}{aspect.tension_score}</span>
      </div>
      <div className="aspect-meta">
        <span>Orb {aspect.orb.toFixed(2)}</span>
        <span>{aspect.applying ? "Applying" : "Separating"}</span>
        <span>{aspect.energy}</span>
      </div>
      {showMath ? <p className="math-line">{aspect.math_str}</p> : null}
    </article>
  );
}

function ScoreDial({ score }: { score: number }) {
  const normalized = Math.max(-12, Math.min(12, score));
  const offset = 126 - ((normalized + 12) / 24) * 126;

  return (
    <div className="score-dial" aria-label={`Tension score ${score}`}>
      <svg viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" />
        <circle cx="24" cy="24" r="20" style={{ strokeDashoffset: offset }} />
      </svg>
      <strong>{score > 0 ? "+" : ""}{score}</strong>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <Sparkles size={20} />
      <span>Run a chart to reveal the active geometry.</span>
    </div>
  );
}

function polarToCartesian(longitude: number, radius: number) {
  const angle = ((longitude - 90) * Math.PI) / 180;
  return {
    x: 210 + radius * Math.cos(angle),
    y: 210 + radius * Math.sin(angle)
  };
}

