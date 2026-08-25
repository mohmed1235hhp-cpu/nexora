-- Migration 0006: remove disabled community/social features.
-- Profile/follow tables are intentionally preserved because the profile page
-- is protected and must not be changed. Notifications are also preserved
-- because they are used by non-community system tips.

DROP TABLE IF EXISTS contest_winners CASCADE;
DROP TABLE IF EXISTS contest_participations CASCADE;
DROP TABLE IF EXISTS contests CASCADE;
DROP TABLE IF EXISTS group_comments CASCADE;
DROP TABLE IF EXISTS group_posts CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS story_likes CASCADE;
DROP TABLE IF EXISTS story_views CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Contest-specific enum types are no longer needed by the application.
DROP TYPE IF EXISTS contest_prize_type CASCADE;
DROP TYPE IF EXISTS contest_status CASCADE;
