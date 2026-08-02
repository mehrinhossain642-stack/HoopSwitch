module TeamSerializer
  def self.call(team, include_postings: true)
    payload = {
      id: team.id,
      name: team.name,
      league: team.league,
      location: team.location,
      wins: team.wins,
      losses: team.losses,
      record: team.record,
      roster_size: team.roster_size,
      coach_name: team.coach_name,
      about: team.about,
      logo_url: team.logo_url
    }

    if include_postings
      payload[:open_slots_count] = team.open_slots_count
      payload[:postings] = team.postings.order(:created_at).map do |posting|
        # include_team: false — the team is the parent of this payload already.
        PostingSerializer.call(posting, include_team: false)
      end
    end

    payload
  end
end
