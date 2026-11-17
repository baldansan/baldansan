-- 102: «Миний сурах систем»-ийн сануулгыг сурагчийн сонгосон цагт утсанд илгээх.
-- 10 минут тутам аппын /api/cron/study-reminders-ийг дуудна. Дахин ажиллуулахад аюулгүй.
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('study-reminders');
exception when others then null;
end $$;

select cron.schedule(
  'study-reminders',
  '*/10 * * * *',
  $$ select net.http_get('https://surtsgaay.buunduu.mn/api/cron/study-reminders'); $$
);
