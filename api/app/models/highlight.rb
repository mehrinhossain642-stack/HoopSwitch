# The media hook (proposal §3). MVP only ever creates "external" rows — a
# YouTube/Hudl link, no hosting and no storage cost. When uploads ship they
# become "uploaded" rows pointing at a CDN URL: additive, no schema churn.
class Highlight < ApplicationRecord
  SOURCE_TYPES = %w[external uploaded].freeze

  belongs_to :player_profile

  validates :title, presence: true
  validates :url, presence: true
  validates :source_type, inclusion: { in: SOURCE_TYPES }
  validates :duration_seconds, numericality: { in: 0..7200 }, allow_nil: true

  # Uploads are out of scope for the MVP; reject them at the model boundary so
  # the constraint is explicit rather than merely unimplemented.
  validate :external_only_in_mvp

  private

  def external_only_in_mvp
    return if source_type == "external"

    errors.add(:source_type, "uploads are not supported yet — use an external URL")
  end
end
