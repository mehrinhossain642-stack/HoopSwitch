# Account + role. A user is either a player (owns one player_profile) or a
# coach (owns one team). See proposal §3.
class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  ROLES = %w[player coach parent].freeze

  devise :database_authenticatable, :registerable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  has_one :player_profile, dependent: :destroy
  has_one :team, dependent: :destroy

  validates :role, presence: true, inclusion: { in: ROLES }

  def parent?
    role == "parent"
  end
 
  def player?
    role == "player"
  end

  def coach?
    role == "coach"
  end

  # devise-jwt calls this to build the token payload. `super` supplies the `jti`
  # the JTIMatcher revocation strategy checks on every request — dropping it
  # would make every issued token read as revoked.
  def jwt_payload
    super.merge("role" => role)
  end
end
