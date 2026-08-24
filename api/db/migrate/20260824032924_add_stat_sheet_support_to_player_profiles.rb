class AddStatSheetSupportToPlayerProfiles < ActiveRecord::Migration[8.1]
  def change
    # Second identifier for statsheet matching, alongside the account email.
    #
    # Deliberately NOT unique: two players on different teams are both allowed to
    # wear 23. The upload endpoint treats a number matching more than one profile
    # as ambiguous and refuses the row rather than guessing.
    add_column :player_profiles, :jersey_number, :integer
    add_index :player_profiles, :jersey_number

    # Provenance for stats written by a coach's upload. A coach's sheet overwrites
    # the player's own figures, so who did it and when has to be recoverable —
    # otherwise a bad upload is indistinguishable from the player's own numbers.
    add_column :player_profiles, :stats_updated_at, :datetime
    add_reference :player_profiles, :stats_updated_by_team,
                  foreign_key: { to_table: :teams }, null: true
  end
end
