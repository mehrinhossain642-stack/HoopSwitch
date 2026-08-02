class Team < ApplicationRecord
  belongs_to :user
  has_many :postings, dependent: :destroy

  validates :name, presence: true
  validates :wins, :losses, numericality: { greater_than_or_equal_to: 0 }
  validates :roster_size, numericality: { in: 0..40 }

  def open_slots_count
    postings.count { |posting| posting.status == "open" }
  end

  def record
    "#{wins}–#{losses}"
  end
end
