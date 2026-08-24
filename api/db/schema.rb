# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_08_25_010000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "career_stats", force: :cascade do |t|
    t.decimal "apg", precision: 4, scale: 1, default: "0.0", null: false
    t.datetime "created_at", null: false
    t.integer "gp", default: 0, null: false
    t.bigint "player_profile_id", null: false
    t.decimal "ppg", precision: 4, scale: 1, default: "0.0", null: false
    t.decimal "rpg", precision: 4, scale: 1, default: "0.0", null: false
    t.string "season", null: false
    t.string "team_name", null: false
    t.datetime "updated_at", null: false
    t.index ["player_profile_id", "season"], name: "index_career_stats_on_player_profile_id_and_season", unique: true
    t.index ["player_profile_id"], name: "index_career_stats_on_player_profile_id"
  end

  create_table "connections", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "initiated_by", null: false
    t.bigint "player_profile_id", null: false
    t.bigint "posting_id", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["player_profile_id"], name: "index_connections_on_player_profile_id"
    t.index ["posting_id", "player_profile_id"], name: "index_connections_on_posting_id_and_player_profile_id", unique: true
    t.index ["posting_id"], name: "index_connections_on_posting_id"
    t.check_constraint "initiated_by::text = ANY (ARRAY['player'::character varying::text, 'coach'::character varying::text])", name: "connections_initiated_by_check"
    t.check_constraint "status::text = ANY (ARRAY['pending'::character varying::text, 'accepted'::character varying::text, 'declined'::character varying::text])", name: "connections_status_check"
  end

  create_table "game_stats", force: :cascade do |t|
    t.integer "ast", default: 0, null: false
    t.integer "blk", default: 0, null: false
    t.datetime "created_at", null: false
    t.integer "fga", default: 0, null: false
    t.integer "fgm", default: 0, null: false
    t.integer "fta", default: 0, null: false
    t.integer "ftm", default: 0, null: false
    t.bigint "game_id", null: false
    t.integer "minutes", default: 0, null: false
    t.bigint "player_profile_id", null: false
    t.integer "pts", default: 0, null: false
    t.integer "reb", default: 0, null: false
    t.integer "stl", default: 0, null: false
    t.integer "tov", default: 0, null: false
    t.integer "tpa", default: 0, null: false
    t.integer "tpm", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["game_id", "player_profile_id"], name: "index_game_stats_on_game_id_and_player_profile_id", unique: true
    t.index ["game_id"], name: "index_game_stats_on_game_id"
    t.index ["player_profile_id"], name: "index_game_stats_on_player_profile_id"
    t.check_constraint "fgm <= fga", name: "game_stats_fg_check"
    t.check_constraint "ftm <= fta", name: "game_stats_ft_check"
    t.check_constraint "tpm <= tpa", name: "game_stats_tp_check"
  end

  create_table "games", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.string "opponent", null: false
    t.date "played_on", null: false
    t.text "review_note"
    t.datetime "reviewed_at"
    t.bigint "reviewed_by_id"
    t.string "status", default: "pending", null: false
    t.bigint "team_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_games_on_created_by_id"
    t.index ["reviewed_by_id"], name: "index_games_on_reviewed_by_id"
    t.index ["status"], name: "index_games_on_status"
    t.index ["team_id", "played_on"], name: "index_games_on_team_id_and_played_on"
    t.index ["team_id"], name: "index_games_on_team_id"
    t.check_constraint "status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])", name: "games_status_check"
  end

  create_table "highlights", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "duration_seconds"
    t.bigint "player_profile_id", null: false
    t.string "source_type", default: "external", null: false
    t.string "thumbnail_url"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "url", null: false
    t.index ["player_profile_id"], name: "index_highlights_on_player_profile_id"
    t.check_constraint "source_type::text = ANY (ARRAY['external'::character varying::text, 'uploaded'::character varying::text])", name: "highlights_source_type_check"
  end

  create_table "parent_athletes", force: :cascade do |t|
    t.bigint "athlete_id", null: false
    t.datetime "created_at", null: false
    t.bigint "parent_id", null: false
    t.datetime "updated_at", null: false
    t.index ["athlete_id"], name: "index_parent_athletes_on_athlete_id"
    t.index ["parent_id", "athlete_id"], name: "index_parent_athletes_on_parent_id_and_athlete_id", unique: true
    t.index ["parent_id"], name: "index_parent_athletes_on_parent_id"
  end

  create_table "player_profiles", force: :cascade do |t|
    t.integer "age", null: false
    t.decimal "apg", precision: 4, scale: 1, default: "0.0", null: false
    t.text "bio"
    t.string "city"
    t.datetime "created_at", null: false
    t.string "current_team"
    t.string "dominant_hand", default: "Right", null: false
    t.integer "eligibility_years", default: 1, null: false
    t.decimal "fg_pct", precision: 4, scale: 1, default: "0.0", null: false
    t.integer "games_played", default: 0, null: false
    t.string "goals", default: [], null: false, array: true
    t.string "grade"
    t.integer "graduation_year"
    t.integer "height_cm", null: false
    t.integer "jersey_number"
    t.string "location"
    t.string "name", null: false
    t.datetime "onboarding_completed_at"
    t.string "position", null: false
    t.decimal "ppg", precision: 4, scale: 1, default: "0.0", null: false
    t.string "province"
    t.decimal "rpg", precision: 4, scale: 1, default: "0.0", null: false
    t.string "school"
    t.string "secondary_position"
    t.decimal "self_reported_apg", precision: 4, scale: 1
    t.decimal "self_reported_fg_pct", precision: 4, scale: 1
    t.decimal "self_reported_ppg", precision: 4, scale: 1
    t.decimal "self_reported_rpg", precision: 4, scale: 1
    t.string "short_term_goal"
    t.datetime "stats_updated_at"
    t.bigint "stats_updated_by_team_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.decimal "weight_kg", precision: 5, scale: 1, null: false
    t.integer "wingspan_cm", null: false
    t.index ["jersey_number"], name: "index_player_profiles_on_jersey_number"
    t.index ["onboarding_completed_at"], name: "index_player_profiles_on_onboarding_completed_at"
    t.index ["position"], name: "index_player_profiles_on_position"
    t.index ["stats_updated_by_team_id"], name: "index_player_profiles_on_stats_updated_by_team_id"
    t.index ["user_id"], name: "index_player_profiles_on_user_id", unique: true
    t.check_constraint "\"position\"::text = ANY (ARRAY['PG'::character varying::text, 'SG'::character varying::text, 'SF'::character varying::text, 'PF'::character varying::text, 'C'::character varying::text])", name: "player_profiles_position_check"
    t.check_constraint "dominant_hand::text = ANY (ARRAY['Left'::character varying::text, 'Right'::character varying::text, 'Ambidextrous'::character varying::text])", name: "player_profiles_hand_check"
    t.check_constraint "goals <@ ARRAY['u_sports'::character varying, 'ncaa'::character varying, 'professional'::character varying, 'skills'::character varying, 'exposure'::character varying]", name: "player_profiles_goals_check"
    t.check_constraint "secondary_position IS NULL OR (secondary_position::text = ANY (ARRAY['PG'::character varying, 'SG'::character varying, 'SF'::character varying, 'PF'::character varying, 'C'::character varying]::text[]))", name: "player_profiles_secondary_position_check"
  end

  create_table "postings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "expected_minutes", default: 20, null: false
    t.string "headline"
    t.integer "ideal_height_cm", null: false
    t.decimal "ideal_weight_kg", precision: 5, scale: 1, null: false
    t.text "notes"
    t.string "position", null: false
    t.string "status", default: "open", null: false
    t.bigint "team_id", null: false
    t.datetime "updated_at", null: false
    t.index ["position"], name: "index_postings_on_position"
    t.index ["status"], name: "index_postings_on_status"
    t.index ["team_id"], name: "index_postings_on_team_id"
    t.check_constraint "\"position\"::text = ANY (ARRAY['PG'::character varying::text, 'SG'::character varying::text, 'SF'::character varying::text, 'PF'::character varying::text, 'C'::character varying::text])", name: "postings_position_check"
    t.check_constraint "status::text = ANY (ARRAY['open'::character varying::text, 'in_review'::character varying::text, 'closed'::character varying::text])", name: "postings_status_check"
  end

  create_table "teams", force: :cascade do |t|
    t.text "about"
    t.string "coach_name"
    t.datetime "created_at", null: false
    t.string "league"
    t.string "location"
    t.string "logo_url"
    t.integer "losses", default: 0, null: false
    t.string "name", null: false
    t.integer "roster_size", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.integer "wins", default: 0, null: false
    t.index ["user_id"], name: "index_teams_on_user_id", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "jti", null: false
    t.string "role", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.check_constraint "role::text = ANY (ARRAY['player'::character varying, 'coach'::character varying, 'parent'::character varying, 'admin'::character varying]::text[])", name: "users_role_check"
  end

  add_foreign_key "career_stats", "player_profiles"
  add_foreign_key "connections", "player_profiles"
  add_foreign_key "connections", "postings"
  add_foreign_key "game_stats", "games"
  add_foreign_key "game_stats", "player_profiles"
  add_foreign_key "games", "teams"
  add_foreign_key "games", "users", column: "created_by_id"
  add_foreign_key "games", "users", column: "reviewed_by_id"
  add_foreign_key "highlights", "player_profiles"
  add_foreign_key "parent_athletes", "users", column: "athlete_id"
  add_foreign_key "parent_athletes", "users", column: "parent_id"
  add_foreign_key "player_profiles", "teams", column: "stats_updated_by_team_id"
  add_foreign_key "player_profiles", "users"
  add_foreign_key "postings", "teams"
  add_foreign_key "teams", "users"
end
