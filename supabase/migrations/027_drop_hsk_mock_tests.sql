-- Rollback HSK mock test packages (replaced by new implementation)

drop table if exists public.hsk_mock_tests cascade;

-- Storage bucket objects remain until manually cleared in Dashboard.
-- Bucket: hsk-mock-media
