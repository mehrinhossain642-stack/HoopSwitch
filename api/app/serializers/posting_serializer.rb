module PostingSerializer
  def self.call(posting, match: nil, include_team: true)
    payload = {
      id: posting.id,
      team_id: posting.team_id,
      position: posting.position,
      ideal_height_cm: posting.ideal_height_cm,
      ideal_weight_kg: posting.ideal_weight_kg.to_f,
      expected_minutes: posting.expected_minutes,
      status: posting.status,
      notes: posting.notes,
      headline: posting.headline,
      applicant_count: posting.applicant_count,
      # The client formats relative time ("2h ago") from this.
      created_at: posting.created_at.iso8601
    }

    payload[:team] = TeamSerializer.call(posting.team, include_postings: false) if include_team
    payload[:match] = match.as_json if match
    payload
  end
end
