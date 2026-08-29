export interface TagRule {
  slug: string;
  pattern: RegExp;
}

export const TAG_RULES: readonly TagRule[] = [
  {
    slug: "history",
    pattern:
      /\b(Petra|Pyramids?|Great Wall|Chichen Itza|Colosseum|Machu Picchu|Angkor Wat|ancient|ruins)\b/i,
  },
  {
    slug: "architecture",
    pattern:
      /\b(Eiffel Tower|Brooklyn Bridge|Colosseum|Christ the Redeemer|Great Wall|Pyramids?|cathedral|tower|bridge|palace|castle)\b/i,
  },
  {
    slug: "iconic",
    pattern:
      /\b(Petra|Shibuya|Eiffel Tower|Santorini|Grand Canyon|Pyramids?|Taj Mahal|Colosseum|Great Wall|Chichen Itza|Christ the Redeemer|Angkor Wat|Machu Picchu|Kilimanjaro|Broadway|Seven Wonders)\b/i,
  },
  {
    slug: "nightlife",
    pattern: /\b(casino|karaoke|nightlife|masquerade|open-mic)\b/i,
  },
  {
    slug: "music",
    pattern: /\b(concert|jazz|karaoke|music festival)\b/i,
  },
  {
    slug: "live-performance",
    pattern: /\b(opera|ballet|Broadway|theater|stand-up|comedy|jazz)\b/i,
  },
  {
    slug: "dance",
    pattern: /\b(tango|flamenco|dance|ballet)\b/i,
  },
  {
    slug: "festivals",
    pattern:
      /\b(film festival|Oktoberfest|Carnival|Day of the Dead|Holi|music festival)\b/i,
  },
  {
    slug: "wildlife",
    pattern: /\b(safari|whale watching|whale sharks|gorillas|wildlife)\b/i,
  },
  {
    slug: "ocean",
    pattern: /\b(snorkel\w*|scuba|freediv\w*|whale|Blue Lagoon)\b/i,
  },
  {
    slug: "beaches",
    pattern: /\b(beach|Blue Lagoon)\b/i,
  },
  {
    slug: "mountains",
    pattern: /\b(Kilimanjaro|Everest|via ferrata|mountain\w*|peak)\b/i,
  },
  {
    slug: "winter",
    pattern: /\b(dog sledding|Northern Lights|aurora|glacier|midnight sun)\b/i,
  },
  {
    slug: "scenic",
    pattern:
      /\b(sunrise|sunset|view|stargaz\w*|meteor shower|solar eclipse|gondola|hot-air balloon)\b/i,
  },
  {
    slug: "journey",
    pattern:
      /\b(Route 66|Ring Road|sleeper train|road trip|ferry|border|map pin|Glacier Express)\b/i,
  },
  {
    slug: "food-tasting",
    pattern:
      /\b(tasting|food tour|omakase|truffle|street food|traditional market)\b/i,
  },
  {
    slug: "creative",
    pattern: /\b(pottery|glassblowing|pasta|cooking class)\b/i,
  },
  {
    slug: "culture",
    pattern: /\b(Holi|Day of the Dead|sumo|Carnival|tango|flamenco)\b/i,
  },
  {
    slug: "relaxation",
    pattern: /\b(houseboat|historic hotel|hot spring)\b/i,
  },
  {
    slug: "adrenaline",
    pattern:
      /\b(skydiv\w*|bungee|zipline|via ferrata|paraglid\w*|kitesurf\w*|white-water|canyoning|coasteering|wild-caving|freediv\w*|climb\w*|\w*raft\w*)\b/i,
  },
  {
    slug: "hiking",
    pattern: /\b(hike|hiking|trek|Everest Base Camp)\b/i,
  },
  {
    slug: "bucket-list",
    pattern:
      /\b(Antarctica|seven continents|Seven Wonders|UNESCO|Everest|Kilimanjaro|Machu Picchu)\b/i,
  },
  {
    slug: "desert",
    pattern: /\b(desert|sandboarding)\b/i,
  },
  {
    slug: "boating",
    pattern: /\b(sailing|gondola|houseboat|ferry)\b/i,
  },
  {
    slug: "aerial",
    pattern: /\b(hot-air balloon|small plane|paraglid\w*|skydiv\w*)\b/i,
  },
];

export interface TagSuggestion {
  title: string;
  suggestedTagSlugs: readonly string[];
  status: "matched" | "unmatched";
}

export function suggestTags(title: string): TagSuggestion {
  const suggestedTagSlugs = TAG_RULES.filter((rule) =>
    rule.pattern.test(title),
  ).map((rule) => rule.slug);

  return {
    title,
    suggestedTagSlugs,
    status: suggestedTagSlugs.length > 0 ? "matched" : "unmatched",
  };
}
