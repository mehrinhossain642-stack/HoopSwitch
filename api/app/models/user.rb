# Account + role. A user is either a player (owns one player_profile) or a
# coach (owns one team). See proposal §3.
class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  ROLES = %w[player parent coach].freeze

  devise :database_authenticatable, :registerable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  has_one :player_profile, dependent: :destroy
  has_one :team, dependent: :destroy
  
  has_many :parent_athlete_links,
         class_name: "ParentAthlete",
         foreign_key: :parent_id,
         dependent: :destroy

has_many :athlete_parent_links,
         class_name: "ParentAthlete",
         foreign_key: :athlete_id,
         dependent: :destroy

has_many :athletes,
         through: :parent_athlete_links,
         source: :athlete

has_many :parents,
         through: :athlete_parent_links,
         source: :parent

  validates :role, presence: true, inclusion: { in: ROLES }

  def player?
  role == "player"
end

def parent?
  role == "parent"
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
