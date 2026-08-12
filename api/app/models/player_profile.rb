# A player's public profile. Physicals are metric-canonical (cm / kg).
class PlayerProfile < ApplicationRecord
  POSITIONS = %w[PG SG SF PF C].freeze
  HANDS = %w[Left Right Ambidextrous].freeze

  # Onboarding step 3. Keys are stable; labels live in the client.
  GOALS = %w[u_sports ncaa professional skills exposure].freeze

  GRADES = [
    "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Prep / Post-grad",
    "University Year 1", "University Year 2", "University Year 3",
    "University Year 4", "University Year 5"
  ].freeze

  PROVINCES = %w[AB BC MB NB NL NS NT NU ON PE QC SK YT].freeze

  belongs_to :user
  has_many :career_stats, dependent: :destroy
  has_many :highlights, dependent: :destroy
  has_many :connections, dependent: :destroy
  has_many :postings, through: :connections

  validates :name, presence: true
  validates :position, presence: true, inclusion: { in: POSITIONS }
  validates :dominant_hand, inclusion: { in: HANDS }
  validates :height_cm, numericality: { in: 140..240 }
  validates :wingspan_cm, numericality: { in: 140..260 }
  validates :weight_kg, numericality: { in: 40..200 }
  validates :age, numericality: { in: 15..40 }
  validates :eligibility_years, numericality: { in: 0..5 }
  validates :ppg, :rpg, :apg, numericality: { in: 0..60 }
  validates :fg_pct, numericality: { in: 0..100 }

  # --- onboarding fields (all optional until the flow completes) -----------

  validates :secondary_position, inclusion: { in: POSITIONS }, allow_nil: true
  validates :grade, inclusion: { in: GRADES }, allow_nil: true
  validates :province, inclusion: { in: PROVINCES }, allow_nil: true
  validates :graduation_year, numericality: { in: 2000..2040 }, allow_nil: true

  validate :goals_are_known
  validate :secondary_position_differs_from_primary

  # `location` is what the feed cards render. City/province are the structured
  # source of truth once onboarding supplies them, so keep the display string
  # derived rather than letting the two drift apart.
  before_save :sync_location_from_city_and_province

  scope :onboarded, -> { where.not(onboarding_completed_at: nil) }

  def onboarding_complete?
    onboarding_completed_at.present?
  end

  private

  def goals_are_known
    unknown = Array(goals) - GOALS
    return if unknown.empty?

    errors.add(:goals, "contains unknown values: #{unknown.join(', ')}")
  end

  def secondary_position_differs_from_primary
    return if secondary_position.blank? || secondary_position != position

    errors.add(:secondary_position, "must differ from your primary position")
  end

  def sync_location_from_city_and_province
    return if city.blank? && province.blank?
    return unless will_save_change_to_city? || will_save_change_to_province?

    self.location = [ city.presence, province.presence ].compact.join(", ")
  end
end
