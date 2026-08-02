# Full HoopSwitch MVP schema, per tech proposal §3.
#
# Physical measurements are stored canonically in metric (cm / kg); the client
# converts to ft/in and lbs for display. This keeps units unambiguous server-side.
class CreateHoopSwitchSchema < ActiveRecord::Migration[8.1]
  POSITIONS = %w[PG SG SF PF C].freeze

  def position_check_sql
    "position IN (#{POSITIONS.map { |p| "'#{p}'" }.join(',')})"
  end

  def change
    # --- users -------------------------------------------------------------
    create_table :users do |t|
      t.string :email, null: false
      t.string :encrypted_password, null: false, default: ""
      t.string :role, null: false
      # devise-jwt JTIMatcher revocation: rotating this invalidates issued tokens.
      t.string :jti, null: false

      t.timestamps
    end
    add_index :users, :email, unique: true
    add_index :users, :jti, unique: true
    add_check_constraint :users, "role IN ('player','coach')", name: "users_role_check"

    # --- player_profiles ---------------------------------------------------
    create_table :player_profiles do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.string  :name, null: false
      t.string  :position, null: false
      t.integer :height_cm, null: false
      t.decimal :weight_kg, null: false, precision: 5, scale: 1
      t.integer :wingspan_cm, null: false
      t.integer :age, null: false
      t.string  :dominant_hand, null: false, default: "Right"
      t.integer :eligibility_years, null: false, default: 1
      t.string  :location
      t.text    :bio
      t.decimal :ppg, null: false, default: 0, precision: 4, scale: 1
      t.decimal :rpg, null: false, default: 0, precision: 4, scale: 1
      t.decimal :apg, null: false, default: 0, precision: 4, scale: 1
      t.decimal :fg_pct, null: false, default: 0, precision: 4, scale: 1

      t.timestamps
    end
    add_index :player_profiles, :position
    add_check_constraint :player_profiles, position_check_sql,
                         name: "player_profiles_position_check"
    add_check_constraint :player_profiles,
                         "dominant_hand IN ('Left','Right','Ambidextrous')",
                         name: "player_profiles_hand_check"

    # --- career_stats ------------------------------------------------------
    create_table :career_stats do |t|
      t.references :player_profile, null: false, foreign_key: true
      t.string  :season, null: false
      t.string  :team_name, null: false
      t.integer :gp, null: false, default: 0
      t.decimal :ppg, null: false, default: 0, precision: 4, scale: 1
      t.decimal :rpg, null: false, default: 0, precision: 4, scale: 1
      t.decimal :apg, null: false, default: 0, precision: 4, scale: 1

      t.timestamps
    end
    add_index :career_stats, %i[player_profile_id season], unique: true

    # --- highlights --------------------------------------------------------
    # source_type + url is the media hook (proposal §3). MVP is always
    # "external"; uploads later add "uploaded" rows pointing at a CDN URL.
    create_table :highlights do |t|
      t.references :player_profile, null: false, foreign_key: true
      t.string  :title, null: false
      t.string  :source_type, null: false, default: "external"
      t.string  :url, null: false
      t.integer :duration_seconds
      t.string  :thumbnail_url

      t.timestamps
    end
    add_check_constraint :highlights,
                         "source_type IN ('external','uploaded')",
                         name: "highlights_source_type_check"

    # --- teams -------------------------------------------------------------
    create_table :teams do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.string  :name, null: false
      t.string  :league
      t.string  :location
      t.integer :wins, null: false, default: 0
      t.integer :losses, null: false, default: 0
      t.integer :roster_size, null: false, default: 0
      t.string  :coach_name
      t.text    :about
      # Nullable: MVP renders initials-based logos, no storage ships.
      t.string  :logo_url

      t.timestamps
    end

    # --- postings ----------------------------------------------------------
    create_table :postings do |t|
      t.references :team, null: false, foreign_key: true
      t.string  :position, null: false
      t.integer :ideal_height_cm, null: false
      t.decimal :ideal_weight_kg, null: false, precision: 5, scale: 1
      t.integer :expected_minutes, null: false, default: 20
      t.string  :status, null: false, default: "open"
      t.text    :notes
      # Display headline for the feed card, e.g. "Looking for a starting Point Guard".
      t.string  :headline

      t.timestamps
    end
    add_index :postings, :status
    add_index :postings, :position
    add_check_constraint :postings, position_check_sql,
                         name: "postings_position_check"
    add_check_constraint :postings,
                         "status IN ('open','in_review','closed')",
                         name: "postings_status_check"

    # --- connections -------------------------------------------------------
    # One table captures both directions (proposal §3): a player applying and a
    # coach inviting are the same relationship with a different initiated_by.
    create_table :connections do |t|
      t.references :posting, null: false, foreign_key: true
      t.references :player_profile, null: false, foreign_key: true
      t.string :initiated_by, null: false
      t.string :status, null: false, default: "pending"

      t.timestamps
    end
    add_index :connections, %i[posting_id player_profile_id], unique: true
    add_check_constraint :connections,
                         "initiated_by IN ('player','coach')",
                         name: "connections_initiated_by_check"
    add_check_constraint :connections,
                         "status IN ('pending','accepted','declined')",
                         name: "connections_status_check"
  end
end
