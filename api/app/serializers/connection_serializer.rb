module ConnectionSerializer
  def self.call(connection)
    {
      id: connection.id,
      posting_id: connection.posting_id,
      player_profile_id: connection.player_profile_id,
      initiated_by: connection.initiated_by,
      status: connection.status,
      created_at: connection.created_at.iso8601,

      posting: PostingSerializer.call(connection.posting),

      athlete: {
        id: connection.player_profile.id,
        name: connection.player_profile.name,
        position: connection.player_profile.position
      }
    }
  end
end