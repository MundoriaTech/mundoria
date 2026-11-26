-- Keep the applicant's skills-exam answers (question id -> chosen option
-- index or indexes) so admin can see which questions they got wrong, not
-- only the score.
alter table public.cleaner_profiles
  add column if not exists skills_exam_answers jsonb;
