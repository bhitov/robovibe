-- Drop admin tables in reverse order due to foreign key constraints
DROP TABLE IF EXISTS "test_results";
DROP TABLE IF EXISTS "test_prompts";
DROP TABLE IF EXISTS "system_prompts";
DROP TABLE IF EXISTS "admins";