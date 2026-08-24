# Resolves statsheet rows to player profiles and applies them.
#
# A coach's sheet overwrites the player's own reported figures, which are what
# MatchScorer ranks on for *every* team — so this errs toward refusing a row over
# writing the wrong player. Nothing is applied unless `commit!` is called, and the
# same resolution runs for the preview, so what a coach confirms is what lands.
class StatSheetImport
  # Columns a row may carry. `identifier` is required; the rest are optional so a
  # sheet with only scoring can be uploaded without inventing rebound numbers.
  STAT_FIELDS = %w[ppg rpg apg fg_pct].freeze

  RANGES = {
    "ppg" => 0..60,
    "rpg" => 0..60,
    "apg" => 0..60,
    "fg_pct" => 0..100
  }.freeze

  Result = Struct.new(
    :index, :identifier, :status, :player_profile, :player_name, :changes, :message,
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
        changes: changes || {},
        message: message
      }.compact
    end
  end

  def initialize(rows:, team:)
    @rows = Array(rows)
    @team = team
  end

  # Resolve every row without touching the database.
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

  # Applies only the rows that resolved cleanly. All-or-nothing: a sheet that
  # half-lands is worse than one that doesn't, because the coach can't tell which
  # half without re-reading every profile.
  def commit!
    ActiveRecord::Base.transaction do
      matched.each do |result|
        profile = result.player_profile
        profile.assign_attributes(result.changes)
        profile.stats_updated_at = Time.current
        profile.stats_updated_by_team = @team
        profile.save!
      end
    end

    matched.size
  end

  private

  def resolve(row, index)
    row = row.respond_to?(:to_unsafe_h) ? row.to_unsafe_h : row
    row = row.stringify_keys
    identifier = row["identifier"].to_s.strip

    if identifier.empty?
      return invalid(index, identifier, "No email or jersey number in this row")
    end

    changes, error = extract_stats(row)
    return invalid(index, identifier, error) if error
    if changes.empty?
      return invalid(index, identifier, "No stat columns recognised for this row")
    end

    candidates = candidates_for(identifier)

    case candidates.size
    when 0
      Result.new(index: index, identifier: identifier, status: "unmatched",
                 message: "No player matches this email or jersey number")
    when 1
      profile = candidates.first
      Result.new(index: index, identifier: identifier, status: "matched",
                 player_profile: profile, player_name: profile.name,
                 changes: changes)
    else
      # Jersey numbers aren't unique, so this is expected rather than exceptional.
      # Naming the collisions lets the coach switch that row to an email.
      Result.new(
        index: index, identifier: identifier, status: "ambiguous",
        message: "Matches #{candidates.size} players (#{candidates.map(&:name).sort.join(', ')}) " \
                 "— use their email instead"
      )
    end
  end

  # Email first: it's globally unique, so an email hit is never ambiguous. Only
  # fall back to the jersey number when the identifier isn't an email at all.
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
    changes = {}

    STAT_FIELDS.each do |field|
      raw = row[field]
      next if raw.nil? || raw.to_s.strip.empty?

      value = parse_number(raw)
      return [ nil, "#{field.upcase} isn't a number: #{raw.inspect}" ] if value.nil?

      range = RANGES.fetch(field)
      unless range.cover?(value)
        return [ nil, "#{field.upcase} of #{value} is outside #{range.min}–#{range.max}" ]
      end

      changes[field] = value
    end

    [ changes, nil ]
  end

  # Tolerates the shapes spreadsheets actually produce: "47%", " 18.4 ", "1,024".
  def parse_number(raw)
    cleaned = raw.to_s.strip.delete("%").delete(",")
    return nil if cleaned.empty?
    return nil unless cleaned.match?(/\A-?\d+(\.\d+)?\z/)

    cleaned.to_f.round(1)
  end

  def invalid(index, identifier, message)
    Result.new(index: index, identifier: identifier, status: "invalid", message: message)
  end
end
