class AllowParentUserRole < ActiveRecord::Migration[8.1]
  def up
    remove_check_constraint :users, name: "users_role_check"

    add_check_constraint :users,
                         "role IN ('player', 'coach', 'parent')",
                         name: "users_role_check"
  end

  def down
    remove_check_constraint :users, name: "users_role_check"

    add_check_constraint :users,
                         "role IN ('player', 'coach')",
                         name: "users_role_check"
  end
end