class Team < ApplicationRecord
  # Optional: an admin creates the team, then assigns a coach to it. Until then
  # the team exists with no account attached.
  belongs_to :user, optional: true
  has_many :postings, dependent: :destroy
  has_many :games, dependent: :destroy

  validates :name, presence: true
  validates :wins, :losses, numericality: { greater_than_or_equal_to: 0 }
  validates :roster_size, numericality: { in: 0..40 }

  def coach_assigned?
    user_id.present?
  end

  def open_slots_count
    postings.count { |posting| posting.status == "open" }
  end

  def record
    "#{wins}–#{losses}"
  end
end
