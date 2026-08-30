# One row covers both directions (proposal §3): a player applying and a coach
# inviting are the same relationship with a different initiated_by. Half the
# tables, one status flow.
class Connection < ApplicationRecord
  INITIATORS = %w[player parent coach].freeze

STATUSES = %w[
  pending_parent_approval
  under_review
  shared_with_coach
  coach_interested
  tryout_offered
  confirmed
  declined
  not_selected
  closed
].freeze

  belongs_to :posting
  belongs_to :player_profile

  validates :initiated_by, inclusion: { in: INITIATORS }
  validates :status, inclusion: { in: STATUSES }
  validates :player_profile_id,
            uniqueness: { scope: :posting_id,
                          message: "already has a connection for this posting" }

  scope :applications, -> { where(initiated_by: %w[player parent]) }
  scope :invites, -> { where(initiated_by: "coach") }
  
  def parent_application?
  initiated_by == "parent"
end
  def application?
    initiated_by == "player"
  end

  def invite?
    initiated_by == "coach"
  end

  # A player may respond to a coach's invite and vice versa — never to your own.
  def respondable_by?(user)
    return false unless status == "pending"

    invite? ? user.player? && player_profile.user_id == user.id : coach_owns_posting?(user)
  end

  private

  def coach_owns_posting?(user)
    user.coach? && posting.team.user_id == user.id
  end
end
