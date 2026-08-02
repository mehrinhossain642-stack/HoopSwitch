# An open roster slot. Scored against players by MatchScorer.
class Posting < ApplicationRecord
  POSITIONS = %w[PG SG SF PF C].freeze
  STATUSES = %w[open in_review closed].freeze

  belongs_to :team
  has_many :connections, dependent: :destroy
  has_many :player_profiles, through: :connections

  validates :position, presence: true, inclusion: { in: POSITIONS }
  validates :status, inclusion: { in: STATUSES }
  validates :ideal_height_cm, numericality: { in: 150..240 }
  validates :ideal_weight_kg, numericality: { in: 45..200 }
  validates :expected_minutes, numericality: { in: 1..40 }

  scope :open_slots, -> { where(status: "open") }
  scope :visible, -> { where.not(status: "closed") }

  # Derived rather than stored: a counter column would drift from the
  # connections table it is meant to summarise.
  def applicant_count
    connections.count
  end
end
