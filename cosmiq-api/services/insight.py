from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Iterable, Optional

from models.schemas import AspectData, InsightData, SourcePassage


@dataclass(frozen=True)
class DomainRule:
    domain: str
    planets: tuple[str, ...]
    tense_advice: str
    flow_advice: str
    neutral_advice: str


DOMAIN_RULES: tuple[DomainRule, ...] = (
    DomainRule(
        domain="Communication",
        planets=("Mercury", "Moon", "Saturn"),
        tense_advice="Slow the exchange down and make the next agreement explicit before acting on it.",
        flow_advice="Use the clear signal for writing, negotiation, and precise follow-up.",
        neutral_advice="Name the facts first, then let interpretation follow.",
    ),
    DomainRule(
        domain="Drive",
        planets=("Mars", "Sun", "Saturn"),
        tense_advice="Treat friction as a pacing signal. Reduce the surface area before forcing momentum.",
        flow_advice="Move the priority task forward while energy and follow-through are aligned.",
        neutral_advice="Choose one visible action and keep the rest of the day simple.",
    ),
    DomainRule(
        domain="Opportunity",
        planets=("Jupiter", "Venus", "Sun"),
        tense_advice="Do not overextend the promise. Keep the offer concrete and measurable.",
        flow_advice="This is a good window for outreach, generosity, and opening a wider lane.",
        neutral_advice="Look for the practical upside before expanding the plan.",
    ),
    DomainRule(
        domain="Stability",
        planets=("Saturn", "Moon", "Venus"),
        tense_advice="Protect recovery time and avoid making a permanent decision from a temporary mood.",
        flow_advice="Consolidate the pieces that already work. Reliability is the advantage here.",
        neutral_advice="Ground the decision in the body, the calendar, and the available capacity.",
    ),
)


SOURCE_EXCERPTS = {
    "tension": "Hard aspects are treated as visible pressure points: useful when named, risky when ignored.",
    "flow": "Harmonious aspects indicate lower-friction coordination between the planets involved.",
    "support": "Supportive geometry favors cooperation, timing, and clean handoffs between functions.",
    "polarity": "Oppositions ask for balance between two live needs rather than victory for either side.",
    "focus": "Conjunctions concentrate planetary functions and make the combined theme harder to miss.",
}


def build_insights(
    aspects: Iterable[AspectData], requested_domains: Optional[list[str]] = None
) -> list[InsightData]:
    allowed_domains = {domain.lower() for domain in requested_domains or []}
    insights: list[InsightData] = []

    for aspect in sorted(aspects, key=_aspect_priority):
        rule = _select_rule(aspect)
        if allowed_domains and rule.domain.lower() not in allowed_domains:
            continue

        score = _score_aspect(aspect)
        insights.append(
            InsightData(
                domain=rule.domain,
                score=score,
                advice=_advice_for(aspect, rule),
                aspect=aspect,
                math_str=(
                    f"Insight score: 50 - ({aspect.tension_score} x 7.3) "
                    f"- ({aspect.orb:.2f} x 1.4) = {score}"
                ),
                source_passage=_source_for(aspect),
            )
        )

    return insights[:6]


def _select_rule(aspect: AspectData) -> DomainRule:
    involved = {aspect.planet_1, aspect.planet_2}
    return max(
        DOMAIN_RULES,
        key=lambda rule: len(involved.intersection(rule.planets)),
    )


def _score_aspect(aspect: AspectData) -> int:
    score = 50 - (aspect.tension_score * 7.3) - (aspect.orb * 1.4)
    return max(0, min(100, round(score)))


def _advice_for(aspect: AspectData, rule: DomainRule) -> str:
    if aspect.tension_score > 0:
        return rule.tense_advice
    if aspect.tension_score < 0:
        return rule.flow_advice
    return rule.neutral_advice


def _source_for(aspect: AspectData) -> SourcePassage:
    key = aspect.energy if aspect.energy in SOURCE_EXCERPTS else "focus"
    source_id = hashlib.sha1(
        f"{aspect.planet_1}:{aspect.planet_2}:{aspect.name}:{aspect.orb}".encode("utf-8")
    ).hexdigest()[:8]

    return SourcePassage(
        id=source_id,
        source="COSMIQ deterministic fallback rulebook",
        excerpt=SOURCE_EXCERPTS[key],
    )


def _aspect_priority(aspect: AspectData) -> tuple[float, float]:
    return (-abs(aspect.tension_score), aspect.orb)
