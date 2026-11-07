-- Rôles à droits minimaux. Exécuter avec psql -f - après avoir posé :
--   \set app_public_pw '...'
--   \set app_studio_pw '...'
--   \set backup_ro_pw '...'
-- Jamais de mot de passe en dur dans ce fichier.

create role app_public login password :'app_public_pw';
create role app_studio login password :'app_studio_pw';
create role backup_ro login password :'backup_ro_pw';

grant usage on schema public to app_public, app_studio, backup_ro;

-- API publique : dépôts, votes, lecture du contenu public.
grant select, insert on suggestions, reports to app_public;
grant update (status, useful_count, not_useful_count, status_changed_at, published_at, archived_at)
  on suggestions to app_public;
grant select, insert, update on suggestion_votes to app_public;
grant select on articles, media, suggestion_responses, settings, roadmap, snapshot_meta to app_public;
grant insert, update on snapshot_meta to app_public;

-- Studio : tout le contenu, mais aucune empreinte de vote.
grant select, insert, update, delete on
  articles, article_revisions, media, suggestions, suggestion_responses,
  reports, settings, roadmap, studio_users, audit_log, snapshot_meta
  to app_studio;
revoke all on suggestion_votes from app_studio;

-- Sauvegarde : lecture seule, y compris les séquences pour pg_dump.
grant select on all tables in schema public to backup_ro;
grant select on all sequences in schema public to backup_ro;
alter default privileges in schema public grant select on tables to backup_ro;
alter default privileges in schema public grant select on sequences to backup_ro;

-- Garde-fous de temps et de sécurité des sessions.
alter role app_public set statement_timeout = '5s';
alter role app_public set idle_in_transaction_session_timeout = '10s';
alter role app_studio set statement_timeout = '10s';
alter role app_studio set idle_in_transaction_session_timeout = '10s';
alter role backup_ro set statement_timeout = '30s';
alter role backup_ro set default_transaction_read_only = on;
