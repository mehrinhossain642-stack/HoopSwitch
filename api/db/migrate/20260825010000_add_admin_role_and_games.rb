class AddAdminRoleAndGames < ActiveRecord::Migration[8.1]
  def up
    # --- admin role ------------------------------------------------------
    # The role list is enforced by a CHECK constraint, so widening it needs the
    # constraint replaced rather than just the model's ROLES array updated.
    remove_check_constraint :users, name: "users_role_check"
    add_check_constraint :users,
                         "role IN ('player', 'coach', 'parent', 'admin')",
                         name: "users_role_check"

    # --- teams may exist before a coach does -----------------------------
    # An admin creates the team, then assigns a coach. The unique index stays:
    # Postgres allows many NULLs in a unique index, so several unassigned teams
    # coexist while still permitting only one team per coach.
    change_column_null :teams, :user_id, true

    # --- games -----------------------------------------------------------
    # One row per game a team uploads. Approval lives here rather than on the
    # individual stat lines: a coach uploads a box score as a unit, and an admin
    # approves or rejects that unit.
    create_table :games do |t|
      t.references :team, null: false, foreign_key: true
      t.date :played_on, null: false
      t.string :opponent, null: false

      t.string :status, null: false, default: "pending"
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :reviewed_by, foreign_key: { to_table: :users }
      t.datetime :reviewed_at
      t.text :review_note

      t.timestamps
    end

    add_check_constraint :games,
                         "status IN ('pending', 'approved', 'rejected')",
                         name: "games_status_check"
    add_index :games, [ :team_id, :played_on ]
    add_index :games, :status

    # --- per-player box score lines --------------------------------------
    # Makes and attempts are stored separately so percentages aggregate
    # correctly: season FG% is total makes over total attempts, never the mean of
    # per-game percentages.
    create_table :game_stats do |t|
      t.references :game, null: false, foreign_key: true
      t.references :player_profile, null: false, foreign_key: true

      t.integer :minutes, null: false, default: 0
      t.integer :fgm, null: false, default: 0
      t.integer :fga, null: false, default: 0
      t.integer :tpm, null: false, default: 0
      t.integer :tpa, null: false, default: 0
      t.integer :ftm, null: false, default: 0
      t.integer :fta, null: false, default: 0
      t.integer :reb, null: false, default: 0
      t.integer :ast, null: false, default: 0
      t.integer :stl, null: false, default: 0
      t.integer :blk, null: false, default: 0
      t.integer :tov, null: false, default: 0
      t.integer :pts, null: false, default: 0

      t.timestamps
    end

    add_index :game_stats, [ :game_id, :player_profile_id ], unique: true
    add_check_constraint :game_stats, "fgm <= fga", name: "game_stats_fg_check"
    add_check_constraint :game_stats, "tpm <= tpa", name: "game_stats_tp_check"
    add_check_constraint :game_stats, "ftm <= fta", name: "game_stats_ft_check"

    # --- derived vs self-reported averages -------------------------------
    # ppg/rpg/apg/fg_pct stay the *effective* figures, so MatchScorer, the feeds
    # and every card keep reading one field. Once a player has approved games
    # those columns are recomputed from them; the player's own onboarding numbers
    # are snapshotted here first so rejecting every game can restore them.
    add_column :player_profiles, :games_played, :integer, null: false, default: 0
    add_column :player_profiles, :self_reported_ppg, :decimal, precision: 4, scale: 1
    add_column :player_profiles, :self_reported_rpg, :decimal, precision: 4, scale: 1
    add_column :player_profiles, :self_reported_apg, :decimal, precision: 4, scale: 1
    add_column :player_profiles, :self_reported_fg_pct, :decimal, precision: 4, scale: 1
  end

  def down
    remove_column :player_profiles, :self_reported_fg_pct
    remove_column :player_profiles, :self_reported_apg
    remove_column :player_profiles, :self_reported_rpg
    remove_column :player_profiles, :self_reported_ppg
    remove_column :player_profiles, :games_played
    drop_table :game_stats
    drop_table :games
    change_column_null :teams, :user_id, false
    remove_check_constraint :users, name: "users_role_check"
    add_check_constraint :users,
                         "role IN ('player', 'coach', 'parent')",
                         name: "users_role_check"
  end
end
