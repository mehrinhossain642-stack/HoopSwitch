# One player's line in one game.
#
# Makes and attempts are stored rather than percentages so season rates aggregate
# correctly — total makes over total attempts, never the mean of per-game
# percentages, which would weight a 1-for-1 night the same as a 9-for-20 one.
class GameStat < ApplicationRecord
  COUNTING_FIELDS = %i[
    minutes fgm fga tpm tpa ftm fta reb ast stl blk tov pts
  ].freeze

  belongs_to :game
  belongs_to :player_profile

  validates :player_profile_id, uniqueness: { scope: :game_id }

  COUNTING_FIELDS.each do |field|
    validates field, numericality: { only_integer: true, in: 0..200 }
  end

  validate :makes_within_attempts

  private

  # Mirrors the DB check constraints so a bad row fails with a readable message
  # instead of a Postgres error.
  def makes_within_attempts
    { fgm: :fga, tpm: :tpa, ftm: :fta }.each do |made, attempted|
      next if self[made].to_i <= self[attempted].to_i

      errors.add(made, "can't exceed #{attempted.to_s.upcase} " \
                       "(#{self[made]} of #{self[attempted]})")
    end
  end
end
