"use client";

import {
  Activity,
  CalendarDays,
  Download,
  Eye,
  EyeOff,
  Filter,
  History,
  LoaderCircle,
  MapPin,
  Orbit,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Table2,
  Zap
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  AspectData,
  ChartRequest,
  ChartResponse,
  InsightData,
  PlanetData,
  postChart,
  postInsight
} from "@/lib/api";

type AspectFilter = "all" | "tense" | "flow";

type SavedChart = {
  id: string;
  label: string;
  createdAt: string;
  payload: ChartRequest;
  chart: ChartResponse;
};

const storageKey = "cosmiq.recentCharts";

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

const zodiac = ["Ar", "Ta", "Ge", "Cn", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"];

const defaultPayload: ChartRequest = {
  birth_date: "1990-06-15",
  birth_time: "08:30:00+05:30",
  birth_lat: 26.8467,
  birth_lng: 80.9462
};

export function ChartWorkbench() {
  const [payload, setPayload] = useState<ChartRequest>(defaultPayload);
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [recentCharts, setRecentCharts] = useState<SavedChart[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [showMath, setShowMath] = useState(true);
  const [aspectFilter, setAspectFilter] = useState<AspectFilter>("all");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      return;
    }

    try {
      setRecentCharts(JSON.parse(saved) as SavedChart[]);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const nextChart = await postChart(payload);
      setChart(nextChart);
      saveRecentChart(nextChart, payload);
      await generateInsights(nextChart.aspects);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chart request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function generateInsights(aspects: AspectData[]) {
    setIsInsightLoading(true);

    try {
      const response = await postInsight({ aspects });
      setInsights(response.insights);
    } catch (caught) {
      setInsights([]);
      setError(caught instanceof Error ? caught.message : "Insight request failed.");
    } finally {
      setIsInsightLoading(false);
    }
  }

  function saveRecentChart(nextChart: ChartResponse, nextPayload: ChartRequest) {
    const nextEntry: SavedChart = {
      id: `${nextPayload.birth_date}-${nextPayload.birth_time}-${Date.now()}`,
      label: `${nextPayload.birth_date} / ${nextPayload.birth_time}`,
      createdAt: new Date().toISOString(),
      payload: nextPayload,
      chart: nextChart
    };
    const nextRecent = [
      nextEntry,
      ...recentCharts.filter(
        (entry) =>
          entry.payload.birth_date !== nextPayload.birth_date ||
          entry.payload.birth_time !== nextPayload.birth_time
      )
    ].slice(0, 5);

    setRecentCharts(nextRecent);
    window.localStorage.setItem(storageKey, JSON.stringify(nextRecent));
  }

  function loadRecentChart(entry: SavedChart) {
    setPayload(entry.payload);
    setChart(entry.chart);
    setError(null);
    generateInsights(entry.chart.aspects);
  }

  function exportChart() {
    if (!chart) {
      return;
    }

    const documentBody = JSON.stringify({ payload, chart, insights }, null, 2);
    const blob = new Blob([documentBody], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cosmiq-chart-${payload.birth_date}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const totalTension = useMemo(() => {
    if (!chart) {
      return 0;
    }

    return chart.aspects.reduce((total, aspect) => total + aspect.tension_score, 0);
  }, [chart]);

  const filteredAspects = useMemo(() => {
    if (!chart) {
      return [];
    }

    if (aspectFilter === "tense") {
      return chart.aspects.filter((aspect) => aspect.tension_score > 0);
    }

    if (aspectFilter === "flow") {
      return chart.aspects.filter((aspect) => aspect.tension_score < 0);
    }

    return chart.aspects;
  }, [aspectFilter, chart]);

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
          <button
            className="icon-button"
            type="button"
            aria-label="Export chart JSON"
            title="Export chart JSON"
            disabled={!chart}
            onClick={exportChart}
          >
            <Download size={18} />
          </button>
        </div>
      </header>

      <section className="workbench-grid">
        <div className="left-rail">
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

            <div className="button-row">
              <button className="primary-button" type="submit" disabled={isLoading}>
                {isLoading ? <LoaderCircle className="spin" size={18} /> : <Play size={18} />}
                Calculate
              </button>
              <button
                className="secondary-button"
                type="button"
                aria-label="Reset input"
                title="Reset input"
                onClick={() => setPayload(defaultPayload)}
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {error ? <p className="alert">{error}</p> : null}
          </form>

          <section className="history-panel panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Local history</p>
                <h2>Recent charts</h2>
              </div>
              <History size={20} />
            </div>
            <div className="history-list">
              {recentCharts.length ? (
                recentCharts.map((entry) => (
                  <button
                    className="history-item"
                    key={entry.id}
                    type="button"
                    onClick={() => loadRecentChart(entry)}
                  >
                    <strong>{entry.label}</strong>
                    <span>{entry.chart.nakshatra.moon_nakshatra}</span>
                  </button>
                ))
              ) : (
                <p className="quiet-copy">Charts you calculate will appear here on this device.</p>
              )}
            </div>
          </section>
        </div>

        <section className="chart-stage panel">
          <div className="stage-topline">
            <div>
              <p className="eyebrow">Live geometry</p>
              <h2>{chart ? chart.nakshatra.moon_nakshatra : "Awaiting chart"}</h2>
            </div>
            <ScoreDial score={totalTension} />
          </div>

          <ChartWheel chart={chart} loading={isLoading} />
          <PlanetTable chart={chart} />
        </section>

        <section className="insight-panel panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Guidance</p>
              <h2>{isInsightLoading ? "Generating" : `${insights.length || 0} insights`}</h2>
            </div>
            <Zap size={20} />
          </div>

          <div className="insight-list">
            {isInsightLoading ? (
              <LoadingState label="Building transparent fallback insights." />
            ) : insights.length ? (
              insights.map((insight) => (
                <InsightCard insight={insight} key={insight.source_passage.id} showMath={showMath} />
              ))
            ) : (
              <EmptyState label="Calculate a chart to generate deterministic insight cards." />
            )}
          </div>

          <div className="aspect-toolbar">
            <span>
              <Filter size={15} />
              Aspects
            </span>
            <div className="segmented-control" aria-label="Aspect filter">
              {(["all", "tense", "flow"] as AspectFilter[]).map((filter) => (
                <button
                  className={aspectFilter === filter ? "is-selected" : ""}
                  key={filter}
                  type="button"
                  onClick={() => setAspectFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="aspect-list">
            {chart ? (
              filteredAspects.length ? (
                filteredAspects.map((aspect, index) => (
                  <AspectRow
                    aspect={aspect}
                    key={`${aspect.planet_1}-${aspect.planet_2}-${aspect.name}`}
                    showMath={showMath}
                    index={index}
                  />
                ))
              ) : (
                <EmptyState label="No aspects match this filter." />
              )
            ) : (
              <EmptyState label="Run a chart to reveal the active geometry." />
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
      <circle cx={position.x} cy={position.y} fill={planetColors[name] ?? "#151413"} r="8" />
      <text className="planet-label" x={label.x} y={label.y}>
        {planetGlyphs[name] ?? name.slice(0, 2)}
      </text>
    </g>
  );
}

function PlanetTable({ chart }: { chart: ChartResponse | null }) {
  const rows = chart ? Object.entries(chart.planets) : [];

  return (
    <section className="planet-table-wrap">
      <div className="table-heading">
        <span>
          <Table2 size={16} />
          Planet positions
        </span>
        {chart ? <small>JD {chart.julian_day.toFixed(4)}</small> : null}
      </div>
      {rows.length ? (
        <div className="planet-table" role="table" aria-label="Planet positions">
          {rows.map(([name, planet]) => (
            <div className="planet-row" key={name} role="row">
              <strong role="cell">{name}</strong>
              <span role="cell">
                {planet.sign} {planet.degree.toFixed(2)}
              </span>
              <span role="cell">{planet.longitude.toFixed(2)} deg</span>
              <span role="cell">{planet.retrograde ? "Retrograde" : "Direct"}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState label="Planet positions will appear after calculation." />
      )}
    </section>
  );
}

function InsightCard({ insight, showMath }: { insight: InsightData; showMath: boolean }) {
  return (
    <article className="insight-card">
      <div className="insight-topline">
        <span>{insight.domain}</span>
        <strong>{insight.score}</strong>
      </div>
      <p>{insight.advice}</p>
      <small>
        {insight.aspect.planet_1} / {insight.aspect.planet_2} via {insight.aspect.name}
      </small>
      {showMath ? (
        <div className="source-block">
          <code>{insight.math_str}</code>
          <span>{insight.source_passage.excerpt}</span>
        </div>
      ) : null}
    </article>
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
        <span className="aspect-score">
          {aspect.tension_score > 0 ? "+" : ""}
          {aspect.tension_score}
        </span>
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
      <strong>
        {score > 0 ? "+" : ""}
        {score}
      </strong>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <LoaderCircle className="spin" size={20} />
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <Sparkles size={20} />
      <span>{label}</span>
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
