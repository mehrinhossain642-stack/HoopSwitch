module HighlightSerializer
  def self.call(highlight)
    {
      id: highlight.id,
      title: highlight.title,
      source_type: highlight.source_type,
      url: highlight.url,
      duration_seconds: highlight.duration_seconds,
      thumbnail_url: highlight.thumbnail_url
    }
  end
end
