-- Add GIN index for fast full-text search on Content
CREATE INDEX IF NOT EXISTS "content_search_idx"
ON "Content"
USING GIN (
  to_tsvector(
    'english',
    coalesce("title", '') || ' ' ||
    coalesce("description", '') || ' ' ||
    coalesce("transcript", '') || ' ' ||
    coalesce("genre", '')
  )
);