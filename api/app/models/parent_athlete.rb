class ParentAthlete < ApplicationRecord
  belongs_to :parent, class_name: "User"
  belongs_to :athlete, class_name: "User"

  validate :parent_must_be_parent
  validate :athlete_must_be_player

  private

  def parent_must_be_parent
    errors.add(:parent, "must have the parent role") unless parent&.parent?
  end

  def athlete_must_be_player
    errors.add(:athlete, "must have the player role") unless athlete&.player?
  end
end