# Plain-hash serializers. No gem needed at this size, and the shapes mirror the
# TypeScript types in the client's data/types.ts.
#
# One constant per file so Zeitwerk can autoload each by name.
module PlayerSerializer
  def self.call(player, match: nil, include_nested: true)
    payload = {
      id: player.id,
      name: player.name,
      position: player.position,
      height_cm: player.height_cm,
      weight_kg: player.weight_kg.to_f,
      wingspan_cm: player.wingspan_cm,
      age: player.age,
      dominant_hand: player.dominant_hand,
      eligibility_years: player.eligibility_years,
      location: player.location,
      bio: player.bio,
      ppg: player.ppg.to_f,
      rpg: player.rpg.to_f,
      apg: player.apg.to_f,
      fg_pct: player.fg_pct.to_f,
      # Onboarding fields
      school: player.school,
      graduation_year: player.graduation_year,
      grade: player.grade,
      city: player.city,
      province: player.province,
      secondary_position: player.secondary_position,
      current_team: player.current_team,
      goals: player.goals,
      short_term_goal: player.short_term_goal,
      onboarding_complete: player.onboarding_complete?
    }

    if include_nested
      payload[:career_stats] = player.career_stats.recent_first.map { |stat| CareerStatSerializer.call(stat) }
      payload[:highlights] = player.highlights.map { |highlight| HighlightSerializer.call(highlight) }
    end

    payload[:match] = match.as_json if match
    payload
  end
end
