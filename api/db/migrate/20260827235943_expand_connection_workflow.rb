class ExpandConnectionWorkflow < ActiveRecord::Migration[8.1]
  def up
    remove_check_constraint :connections,
                            name: "connections_initiated_by_check"

    remove_check_constraint :connections,
                            name: "connections_status_check"

    # Convert existing connection statuses to the new workflow.
    execute <<~SQL
      UPDATE connections
      SET status = 'pending_parent_approval'
      WHERE status = 'pending'
        AND initiated_by = 'player';
    SQL

    execute <<~SQL
      UPDATE connections
      SET status = 'under_review'
      WHERE status = 'pending'
        AND initiated_by = 'coach';
    SQL

    execute <<~SQL
      UPDATE connections
      SET status = 'confirmed'
      WHERE status = 'accepted';
    SQL

    add_check_constraint :connections,
                         "initiated_by IN ('player', 'parent', 'coach')",
                         name: "connections_initiated_by_check"

    add_check_constraint :connections,
                         "status IN (
                           'pending_parent_approval',
                           'under_review',
                           'shared_with_coach',
                           'coach_interested',
                           'tryout_offered',
                           'confirmed',
                           'declined',
                           'not_selected',
                           'closed'
                         )",
                         name: "connections_status_check"
  end

  def down
    remove_check_constraint :connections,
                            name: "connections_initiated_by_check"

    remove_check_constraint :connections,
                            name: "connections_status_check"

    execute <<~SQL
      UPDATE connections
      SET status = 'pending'
      WHERE status IN (
        'pending_parent_approval',
        'under_review',
        'shared_with_coach',
        'coach_interested',
        'tryout_offered'
      );
    SQL

    execute <<~SQL
      UPDATE connections
      SET status = 'accepted'
      WHERE status = 'confirmed';
    SQL

    execute <<~SQL
      UPDATE connections
      SET status = 'declined'
      WHERE status IN ('not_selected', 'closed');
    SQL

    execute <<~SQL
      UPDATE connections
      SET initiated_by = 'player'
      WHERE initiated_by = 'parent';
    SQL

    add_check_constraint :connections,
                         "initiated_by IN ('player', 'coach')",
                         name: "connections_initiated_by_check"

    add_check_constraint :connections,
                         "status IN ('pending', 'accepted', 'declined')",
                         name: "connections_status_check"
  end
end