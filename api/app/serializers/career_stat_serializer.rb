module CareerStatSerializer
  def self.call(stat)
    {
      id: stat.id,
      season: stat.season,
      team_name: stat.team_name,
      gp: stat.gp,
      ppg: stat.ppg.to_f,
      rpg: stat.rpg.to_f,
      apg: stat.apg.to_f
    }
  end
end
