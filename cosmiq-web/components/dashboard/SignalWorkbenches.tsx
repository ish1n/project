"use client";

import {
  Activity,
  CalendarClock,
  LoaderCircle,
  Moon,
  Orbit,
  Play,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import {
  ChartRequest,
  ForecastResponse,
  MoonResponse,
  postForecast,
  postMoon,
  postTransits,
  TransitResponse
} from "@/lib/api";

const defaultNatal: ChartRequest = {
  birth_date: "1990-06-15",
  birth_time: "08:30:00+05:30",
  birth_lat: 26.8467,
  birth_lng: 80.9462
};

function utcMoment() {
  return new Date().toISOString().replace("Z", "+00:00");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function TransitsWorkbench() {
  const [natal, setNatal] = useState<ChartRequest>(defaultNatal);
  const [transitMoment, setTransitMoment] = useState(utcMoment());
  const [result, setResult] = useState<TransitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      setResult(await postTransits({ natal, transit_moment: transitMoment }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Transit request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <FeatureShell
      eyebrow="Transit operations"
      title="Transits"
      actionIcon={<Activity size={20} />}
    >
      <section className="feature-grid">
        <form className="feature-controls panel" onSubmit={handleSubmit}>
          <PanelTitle eyebrow="Natal input" title="Transit comparison" icon={<ShieldCheck size={20} />} />
          <NatalFields natal={natal} setNatal={setNatal} />
          <label className="field">
            <span>
              <CalendarClock size={16} />
              Transit moment
            </span>
            <input value={transitMoment} onChange={(event) => setTransitMoment(event.target.value)} />
          </label>
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="spin" size={18} /> : <Play size={18} />}
            Run transits
          </button>
          {error ? <p className="alert">{error}</p> : null}
        </form>

        <section className="feature-main panel">
          {result ? (
            <>
              <div className="metric-grid">
                <Metric label="Pressure" value={formatSigned(result.pressure_score)} />
                <Metric label="Aspects" value={String(result.transit_aspects.length)} />
                <Metric label="Moment" value={new Date(result.transit_moment_utc).toLocaleDateString()} />
              </div>
              <article className="recommendation-strip">
                <strong>{result.recommendation}</strong>
                <span>{result.math_summary}</span>
              </article>
              <TransitAspectList result={result} />
            </>
          ) : (
            <EmptyPanel icon={<Activity size={22} />} label="Transit results will appear here." />
          )}
        </section>
      </section>
    </FeatureShell>
  );
}

export function ForecastWorkbench() {
  const [natal, setNatal] = useState<ChartRequest>(defaultNatal);
  const [startDate, setStartDate] = useState(today());
  const [days, setDays] = useState(14);
  const [result, setResult] = useState<ForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      setResult(await postForecast({ natal, start_date: startDate, days }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Forecast request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  const peak = useMemo(() => {
    if (!result?.days.length) return null;
    return [...result.days].sort((a, b) => Math.abs(b.pressure_score) - Math.abs(a.pressure_score))[0];
  }, [result]);

  return (
    <FeatureShell
      eyebrow="Async planning model"
      title="Forecast"
      actionIcon={<CalendarClock size={20} />}
    >
      <section className="feature-grid">
        <form className="feature-controls panel" onSubmit={handleSubmit}>
          <PanelTitle eyebrow="Forecast input" title="Operating window" icon={<TrendingUp size={20} />} />
          <NatalFields natal={natal} setNatal={setNatal} />
          <div className="split-fields">
            <label className="field">
              <span>
                <CalendarClock size={16} />
                Start date
              </span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label className="field">
              <span>
                <Activity size={16} />
                Days
              </span>
              <input
                max={30}
                min={1}
                type="number"
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
              />
            </label>
          </div>
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="spin" size={18} /> : <Play size={18} />}
            Build forecast
          </button>
          {error ? <p className="alert">{error}</p> : null}
        </form>

        <section className="feature-main panel">
          {result ? (
            <>
              <div className="metric-grid">
                <Metric label="Days" value={String(result.days.length)} />
                <Metric label="Peak" value={peak ? formatSigned(peak.pressure_score) : "0"} />
                <Metric label="Generated" value={new Date(result.generated_at_utc).toLocaleTimeString()} />
              </div>
              <article className="recommendation-strip">
                <strong>{result.summary}</strong>
                <span>Daily scores are deterministic noon-UTC transit comparisons.</span>
              </article>
              <div className="forecast-list">
                {result.days.map((day) => (
                  <article className="forecast-row" key={day.date}>
                    <div>
                      <strong>{new Date(`${day.date}T00:00:00`).toLocaleDateString()}</strong>
                      <span>{day.top_window}</span>
                    </div>
                    <div className={`score-pill ${day.pressure_score >= 0 ? "tense" : "flow"}`}>
                      {formatSigned(day.pressure_score)}
                    </div>
                    <small>{day.dominant_energy} / {day.aspect_count} aspects</small>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <EmptyPanel icon={<CalendarClock size={22} />} label="Forecast windows will appear here." />
          )}
        </section>
      </section>
    </FeatureShell>
  );
}

export function MoonWorkbench() {
  const [moment, setMoment] = useState(utcMoment());
  const [result, setResult] = useState<MoonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      setResult(await postMoon({ moment }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Moon request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <FeatureShell eyebrow="Lunar signal" title="Moon" actionIcon={<Moon size={20} />}>
      <section className="feature-grid compact">
        <form className="feature-controls panel" onSubmit={handleSubmit}>
          <PanelTitle eyebrow="Moon input" title="Phase check" icon={<Orbit size={20} />} />
          <label className="field">
            <span>
              <CalendarClock size={16} />
              Moment
            </span>
            <input value={moment} onChange={(event) => setMoment(event.target.value)} />
          </label>
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="spin" size={18} /> : <Play size={18} />}
            Read Moon
          </button>
          {error ? <p className="alert">{error}</p> : null}
        </form>

        <section className="feature-main panel">
          {result ? (
            <>
              <div className="metric-grid">
                <Metric label="Phase" value={result.phase_name} />
                <Metric label="Light" value={`${Math.round(result.illumination * 100)}%`} />
                <Metric label="Sign" value={`${result.moon_sign} ${result.moon_degree.toFixed(2)}`} />
              </div>
              <article className="recommendation-strip">
                <strong>{result.advisory}</strong>
                <span>{result.calculation}</span>
              </article>
              <div className="moon-orbit" aria-label={`Moon phase ${result.phase_name}`}>
                <div style={{ "--illumination": `${result.illumination * 100}%` } as React.CSSProperties} />
                <span>{result.moon_nakshatra}</span>
              </div>
            </>
          ) : (
            <EmptyPanel icon={<Moon size={22} />} label="Moon phase and nakshatra will appear here." />
          )}
        </section>
      </section>
    </FeatureShell>
  );
}

function FeatureShell({
  eyebrow,
  title,
  actionIcon,
  children
}: {
  eyebrow: string;
  title: string;
  actionIcon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="workbench">
      <header className="workbench-hero">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <div className="icon-button" aria-hidden="true">
          {actionIcon}
        </div>
      </header>
      {children}
    </div>
  );
}

function NatalFields({
  natal,
  setNatal
}: {
  natal: ChartRequest;
  setNatal: (value: ChartRequest) => void;
}) {
  return (
    <>
      <label className="field">
        <span>
          <CalendarClock size={16} />
          Birth date
        </span>
        <input
          required
          type="date"
          value={natal.birth_date}
          onChange={(event) => setNatal({ ...natal, birth_date: event.target.value })}
        />
      </label>
      <label className="field">
        <span>
          <Activity size={16} />
          Birth time
        </span>
        <input
          required
          value={natal.birth_time}
          onChange={(event) => setNatal({ ...natal, birth_time: event.target.value })}
        />
      </label>
      <div className="split-fields">
        <label className="field">
          <span>Latitude</span>
          <input
            required
            inputMode="decimal"
            value={natal.birth_lat}
            onChange={(event) => setNatal({ ...natal, birth_lat: Number(event.target.value) })}
          />
        </label>
        <label className="field">
          <span>Longitude</span>
          <input
            required
            inputMode="decimal"
            value={natal.birth_lng}
            onChange={(event) => setNatal({ ...natal, birth_lng: Number(event.target.value) })}
          />
        </label>
      </div>
    </>
  );
}

function TransitAspectList({ result }: { result: TransitResponse }) {
  return (
    <div className="aspect-list feature-aspects">
      {result.transit_aspects.map((aspect) => (
        <article
          className="aspect-row"
          key={`${aspect.natal_planet}-${aspect.transit_planet}-${aspect.name}-${aspect.orb}`}
        >
          <div className="aspect-row-top">
            <span className={`aspect-badge ${aspect.tension_score > 0 ? "tense" : "flow"}`}>
              {aspect.name}
            </span>
            <span className="aspect-planets">
              {aspect.transit_planet} to natal {aspect.natal_planet}
            </span>
            <span className="aspect-score">{formatSigned(aspect.tension_score)}</span>
          </div>
          <div className="aspect-meta">
            <span>Orb {aspect.orb.toFixed(2)}</span>
            <span>{aspect.applying ? "Applying" : "Separating"}</span>
            <span>{aspect.energy}</span>
          </div>
          <p className="math-line">{aspect.math_str}</p>
        </article>
      ))}
    </div>
  );
}

function PanelTitle({
  eyebrow,
  title,
  icon
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="panel-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {icon}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EmptyPanel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="empty-state feature-empty">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
