# Fields collected by the 4-step "Create your profile" onboarding flow.
#
# Everything here is nullable: an account exists the moment /signup returns, and
# onboarding is filled in afterwards one step at a time. `onboarding_completed_at`
# is what the client uses to decide between the onboarding flow and the app.
class AddOnboardingFieldsToPlayerProfiles < ActiveRecord::Migration[8.1]
  def change
    change_table :player_profiles, bulk: true do |t|
      # Step 1 — basics
      t.string  :school
      t.integer :graduation_year
      t.string  :grade
      t.string  :city
      t.string  :province

      # Step 2 — basketball info
      t.string :secondary_position
      t.string :current_team

      # Step 3 — goals & focus. A fixed, small set, so an array column beats a
      # join table here; the CHECK below keeps it honest.
      t.string :goals, array: true, null: false, default: []
      t.string :short_term_goal

      # Step 4 completes the flow.
      t.datetime :onboarding_completed_at
    end

    add_check_constraint :player_profiles,
                         "secondary_position IS NULL OR secondary_position IN ('PG','SG','SF','PF','C')",
                         name: "player_profiles_secondary_position_check"

    add_check_constraint :player_profiles,
                         "goals <@ ARRAY['u_sports','ncaa','professional','skills','exposure']::varchar[]",
                         name: "player_profiles_goals_check"

    add_index :player_profiles, :onboarding_completed_at
  end
end
