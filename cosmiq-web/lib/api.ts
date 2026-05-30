export type ChartRequest = {
  birth_date: string;
  birth_time: string;
  birth_lat: number;
  birth_lng: number;
};

export type PlanetData = {
  longitude: number;
  latitude: number;
  speed: number;
  sign: string;
  degree: number;
  retrograde: boolean;
  sidereal_longitude: number;
};

export type AspectData = {
  planet_1: string;
  planet_2: string;
  name: string;
  symbol: string;
  angle: number;
  exact_angle: number;
  orb: number;
  applying: boolean;
  tension_score: number;
  energy: string;
  math_str: string;
};

export type ChartResponse = {
  julian_day: number;
  t_centuries: number;
  planets: Record<string, PlanetData>;
  aspects: AspectData[];
  nakshatra: {
    moon_nakshatra: string;
    nakshatra_index: number;
    calculation: string;
  };
};

export type SourcePassage = {
  id: string;
  source: string;
  excerpt: string;
};

export type InsightData = {
  domain: string;
  score: number;
  advice: string;
  aspect: AspectData;
  math_str: string;
  source_passage: SourcePassage;
};

export type TransitAspectData = {
  natal_planet: string;
  transit_planet: string;
  name: string;
  symbol: string;
  angle: number;
  exact_angle: number;
  orb: number;
  applying: boolean;
  tension_score: number;
  energy: string;
  math_str: string;
};

export type TransitResponse = {
  transit_moment_utc: string;
  transit_planets: Record<string, PlanetData>;
  transit_aspects: TransitAspectData[];
  pressure_score: number;
  recommendation: string;
  math_summary: string;
};

export type ForecastResponse = {
  generated_at_utc: string;
  days: Array<{
    date: string;
    pressure_score: number;
    dominant_energy: string;
    aspect_count: number;
    top_window: string;
    math_summary: string;
  }>;
  summary: string;
};

export type MoonResponse = {
  moment_utc: string;
  phase_name: string;
  phase_angle: number;
  illumination: number;
  moon_sign: string;
  moon_degree: number;
  moon_speed: number;
  moon_nakshatra: string;
  nakshatra_index: number;
  advisory: string;
  calculation: string;
};

export async function postChart(payload: ChartRequest): Promise<ChartResponse> {
  const response = await fetch("/api/proxy/chart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Chart request failed.");
  }

  return response.json();
}

export async function postInsight(payload: {
  aspects: AspectData[];
  domains?: string[];
}): Promise<{ insights: InsightData[] }> {
  const response = await fetch("/api/proxy/insight", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Insight request failed.");
  }

  return response.json();
}

export async function postTransits(payload: {
  natal: ChartRequest;
  transit_moment?: string;
}): Promise<TransitResponse> {
  const response = await fetch("/api/proxy/transits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Transits request failed.");
  }

  return response.json();
}

export async function postForecast(payload: {
  natal: ChartRequest;
  start_date: string;
  days: number;
}): Promise<ForecastResponse> {
  const response = await fetch("/api/proxy/forecast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Forecast request failed.");
  }

  return response.json();
}

export async function postMoon(payload: { moment?: string }): Promise<MoonResponse> {
  const response = await fetch("/api/proxy/moon", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Moon request failed.");
  }

  return response.json();
}
