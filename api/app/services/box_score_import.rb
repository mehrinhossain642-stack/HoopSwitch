# Resolves one game's box score rows to player profiles, then persists the game.
#
# Replaces the earlier averages import. Coaches upload what actually happened in a
# game; PPG/RPG/APG/FG% are derived from those games by PlayerAverages, so nobody
# types an average in and nothing is "overwritten" in the old sense.
#
# Resolution still errs toward refusing a row over writing the wrong player: a
# mis-keyed identifier would attribute someone else's night to them.
class BoxScoreImport
  # Everything a coach can supply per player. All optional except the identifier —
  # a sheet without steals shouldn't be rejected for it.
  STAT_FIELDS = %w[minutes fgm fga tpm tpa ftm fta reb ast stl blk tov pts].freeze

  # Sanity bounds. Generous enough for a real outlier, tight enough to catch a
  # column pasted into the wrong place.
  MAX = 200

  Result = Struct.new(
    :index, :identifier, :status, :player_profile, :player_name, :stats, :message,
    keyword_init: true
  ) do
    def matched?
      status == "matched"
    end

    def as_json(*)
      {
        index: index,
        identifier: identifier,
        status: status,
        player_id: player_profile&.id,
        player_name: player_name,
        stats: stats || {},
        message: message
      }.compact
    end
  end

  def initialize(rows:, team:, actor:, played_on: nil, opponent: nil)
    @rows = Array(rows)
    @team = team
    @actor = actor
    @played_on = played_on
    @opponent = opponent
  end

  def results
    @results ||= @rows.each_with_index.map { |row, index| resolve(row, index) }
  end

  def matched
    results.select(&:matched?)
  end

  def summary
    counts = results.group_by(&:status).transform_values(&:size)
    {
      total: results.size,
      matched: counts["matched"].to_i,
      unmatched: counts["unmatched"].to_i,
      ambiguous: counts["ambiguous"].to_i,
      invalid: counts["invalid"].to_i
    }
  end

  def game_errors
    errors = []
    errors << "Add the date this game was played" if @played_on.blank?
    errors << "Add who the game was against" if @opponent.blank?
    errors
  end

  # Admin uploads land approved — they are the approving authority, so bouncing
  # their own upload into their own queue would be theatre. A coach's upload lands
  # pending and changes nobody's averages until an admin reviews it.
  def status_for_actor
    @actor.admin? ? "approved" : "pending"
  end

  # Creates the game and its stat lines, then recomputes averages if the game
  # landed approved. All-or-nothing.
  def commit!
    raise ArgumentError, game_errors.join(", ") if game_errors.any?

    game = nil

    ActiveRecord::Base.transaction do
      game = Game.create!(
        team: @team,
        played_on: @played_on,
        opponent: @opponent,
        status: status_for_actor,
        created_by: @actor,
        reviewed_by: @actor.admin? ? @actor : nil,
        reviewed_at: @actor.admin? ? Time.current : nil
      )

      matched.each do |result|
        game.game_stats.create!(result.stats.merge(player_profile: result.player_profile))
      end
    end

    PlayerAverages.recompute_for_game!(game) if game.approved?
    game
  end

  private

  def resolve(row, index)
    row = row.respond_to?(:to_unsafe_h) ? row.to_unsafe_h : row
    row = row.stringify_keys
    identifier = row["identifier"].to_s.strip

    return invalid(index, identifier, "No email or jersey number in this row") if identifier.empty?

    stats, error = extract_stats(row)
    return invalid(index, identifier, error) if error

    if stats.values.all?(&:zero?)
      return invalid(index, identifier, "No box score numbers recognised for this row")
    end

    candidates = candidates_for(identifier)

    case candidates.size
    when 0
      Result.new(index: index, identifier: identifier, status: "unmatched",
                 message: "No player matches this email or jersey number")
    when 1
      profile = candidates.first
      Result.new(index: index, identifier: identifier, status: "matched",
                 player_profile: profile, player_name: profile.name, stats: stats)
    else
      Result.new(
        index: index, identifier: identifier, status: "ambiguous",
        message: "Matches #{candidates.size} players (#{candidates.map(&:name).sort.join(', ')}) " \
                 "— use their email instead"
      )
    end
  end

  # Email first: globally unique, so an email hit is never ambiguous. Jersey
  # numbers aren't unique, so they're only a fallback.
  def candidates_for(identifier)
    if identifier.include?("@")
      PlayerProfile.joins(:user).where("LOWER(users.email) = ?", identifier.downcase).to_a
    elsif identifier.match?(/\A\d{1,3}\z/)
      PlayerProfile.where(jersey_number: identifier.to_i).to_a
    else
      []
    end
  end

  def extract_stats(row)
    stats = {}

    STAT_FIELDS.each do |field|
      value = parse_int(row[field])
      return [ nil, "#{label(field)} isn't a whole number: #{row[field].inspect}" ] if value.nil?
      return [ nil, "#{label(field)} of #{value} looks wrong for one game" ] if value > MAX

      stats[field.to_sym] = value
    end

    # Caught here as well as by the model so the coach sees it in the preview,
    # before committing anything.
    { fgm: :fga, tpm: :tpa, ftm: :fta }.each do |made, attempted|
      next if stats[made] <= stats[attempted]

      return [ nil, "#{label(made.to_s)} (#{stats[made]}) can't exceed " \
                    "#{label(attempted.to_s)} (#{stats[attempted]})" ]
    end

    [ stats, nil ]
  end

  # Blank means "didn't happen", which is 0 — distinct from unparseable, which is
  # an error the coach needs to see.
  def parse_int(raw)
    text = raw.to_s.strip
    return 0 if text.empty? || text == "-"

    # Tolerates "8" and "8.0"; rejects "8.5" for a counting stat.
    return nil unless text.match?(/\A\d+(\.0+)?\z/)

    text.to_f.round
  end

  def label(field)
    field.upcase
  end

  def invalid(index, identifier, message)
    Result.new(index: index, identifier: identifier, status: "invalid", message: message)
  end
end
