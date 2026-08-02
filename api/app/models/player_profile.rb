# A player's public profile. Physicals are metric-canonical (cm / kg).
class PlayerProfile < ApplicationRecord
  POSITIONS = %w[PG SG SF PF C].freeze
  HANDS = %w[Left Right Ambidextrous].freeze

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
end
