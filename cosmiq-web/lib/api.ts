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
