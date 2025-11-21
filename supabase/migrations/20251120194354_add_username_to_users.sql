-- Add a 'username' column to the 'users' table.
-- Make it unique to prevent duplicate usernames.
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Optional: Add a constraint to ensure usernames are not empty.
-- We drop it first to ensure this script is re-runnable, then add it.
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS username_not_empty;

ALTER TABLE public.users
ADD CONSTRAINT username_not_empty CHECK (username IS NOT NULL AND username <> '');
