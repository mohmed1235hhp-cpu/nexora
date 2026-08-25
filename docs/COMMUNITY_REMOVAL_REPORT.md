# Community Removal Report

## Removed runtime features
- Community feed and feed page/API route
- Groups, group detail, group API routes and workspace-builder community route
- Weekly contests, contest participation/winners, Hall of Fame, winner page, contest scheduler and contest/group source schemas
- Social direct messages/conversations and their UI/API route
- Stories UI/API and story source schema
- Community/friend UI, friend requests API route and social navigation
- Community notification UI/API route is no longer mounted
- Contest prize/gift presentation and contest-related reward flow
- Community/follower presentation removed from explore/search/me/portfolio detail UI

## Explicitly preserved
- Profile page was not modified, as requested earlier. Its existing follow/friend-compatible data structures remain so the profile cannot be broken.
- AI conversations use the dedicated `ai_conversations` / `ai_messages` system and were not removed.
- Billing, account, projects, AI tools, App Builder, Preview, and other non-community systems remain.
- Payment-provider webhook references containing the generic word `notifications` are unrelated to community and were not changed.

## Gifts
A dedicated gift module/table was searched for in the archive and none was present. Contest prize/gift UI and contest reward logic were removed with the contest system.

## Database migration
`0006_remove_community_features.sql` removes the fully disabled community tables (contests, groups, stories, and social conversations/messages). Follow/friend tables are intentionally preserved because the profile page is protected from changes. Existing historical migrations were not rewritten.
