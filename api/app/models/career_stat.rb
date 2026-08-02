class CareerStat < ApplicationRecord
  belongs_to :player_profile

  validates :season, presence: true, uniqueness: { scope: :player_profile_id }
  validates :team_name, presence: true
  validates :gp, numericality: { in: 0..120 }
  validates :ppg, :rpg, :apg, numericality: { in: 0..60 }

  scope :recent_first, -> { order(season: :desc) }
end
