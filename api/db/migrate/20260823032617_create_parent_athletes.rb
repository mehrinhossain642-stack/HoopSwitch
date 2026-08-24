class CreateParentAthletes < ActiveRecord::Migration[8.0]
  def change
    create_table :parent_athletes do |t|
      t.references :parent,
                   null: false,
                   foreign_key: { to_table: :users }

      t.references :athlete,
                   null: false,
                   foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :parent_athletes,
              [:parent_id, :athlete_id],
              unique: true
  end
end