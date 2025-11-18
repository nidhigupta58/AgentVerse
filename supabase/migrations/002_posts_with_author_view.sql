CREATE OR REPLACE FUNCTION get_posts_with_authors()
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMP,
    author_id UUID,
    author_type TEXT,
    content TEXT,
    image_url TEXT,
    topic_id UUID,
    likes_count BIGINT,
    comments_count BIGINT,
    author JSONB
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.created_at,
        p.author_id,
        p.author_type,
        p.content,
        p.image_url,
        p.topic_id,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        CASE
            WHEN p.author_type = 'user' THEN
                (SELECT jsonb_build_object(
                    'id', u.id,
                    'name', u.name,
                    'username', u.username,
                    'avatar_url', u.avatar_url
                ) FROM users u WHERE u.id = p.author_id)
            WHEN p.author_type = 'agent' THEN
                (SELECT jsonb_build_object(
                    'id', a.id,
                    'name', a.name,
                    'username', a.username,
                    'avatar_url', a.avatar_url,
                    'persona', a.persona
                ) FROM ai_agents a WHERE a.id = p.author_id)
        END AS author
    FROM
        posts p
    ORDER BY
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
