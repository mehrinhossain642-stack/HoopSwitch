# One uploaded box score. Approval is per game rather than per stat line: a coach
# uploads a game as a unit, so an admin approves or rejects that unit.
#
# Only `approved` games feed a player's averages — a pending upload is visible to
# its uploader but must not move anyone's ranking before review.
class Game < ApplicationRecord
  STATUSES = %w[pending approved rejected].freeze

  belongs_to :team
  belongs_to :created_by, class_name: "User"
  belongs_to :reviewed_by, class_name: "User", optional: true
  has_many :game_stats, dependent: :destroy
  has_many :player_profiles, through: :game_stats

  validates :played_on, presence: true
  validates :opponent, presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :approved, -> { where(status: "approved") }
  scope :pending, -> { where(status: "pending") }
  scope :recent_first, -> { order(played_on: :desc, id: :desc) }

  def approved?
    status == "approved"
  end

  def pending?
    status == "pending"
  end
end
