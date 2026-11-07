INSERT INTO "settings" ("key", "value")
VALUES (
  'suggestions',
  '{"retainedVotes":25,"retainedShare":65,"archivedVotes":25,"archivedShare":70,"expiryDays":60,"retentionDays":90,"editionName":"Édition de lancement"}'
)
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "roadmap" ("id", "step_order", "title", "status", "description", "updated_at")
VALUES
  ('step-1', 1, 'Charte : projet en relecture', 'en_cours', 'Soumis à la validation des fondateurs.', '1970-01-01T00:00:00.000Z'),
  ('step-2', 2, 'Bureau : en constitution', 'en_cours', 'Désignation des cinq postes au fur et à mesure.', '1970-01-01T00:00:00.000Z'),
  ('step-3', 3, 'Dossier légal : à venir', 'a_venir', 'Dépôt des statuts dès stabilisation du bureau.', '1970-01-01T00:00:00.000Z')
ON CONFLICT ("id") DO NOTHING;
