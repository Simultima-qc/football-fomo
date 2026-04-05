-- Football FOMO — Seed data
-- Colle dans Supabase SQL Editor → Run

-- Categories
INSERT INTO "categories" ("id", "slug", "nameEn", "nameFr", "color", "createdAt") VALUES
  ('cat_viral',    'viral-moments',  'Viral Moments',       'Moments viraux',        '#ef4444', NOW()),
  ('cat_transfer', 'transfers',      'Transfers',           'Transferts',            '#f59e0b', NOW()),
  ('cat_matches',  'matches',        'Matches',             'Matchs',                '#3b82f6', NOW()),
  ('cat_national', 'national-teams', 'National Teams',      'Équipes nationales',    '#8b5cf6', NOW()),
  ('cat_club',     'club-football',  'Club Football',       'Football de club',      '#10b981', NOW()),
  ('cat_wc2026',   'world-cup-2026', 'World Cup 2026',      'Coupe du monde 2026',   '#f97316', NOW()),
  ('cat_contro',   'controversies',  'Controversies',       'Polémiques',            '#ec4899', NOW()),
  ('cat_injury',   'injuries',       'Injuries',            'Blessures',             '#6b7280', NOW()),
  ('cat_buzz',     'social-buzz',    'Social Buzz',         'Buzz social',           '#14b8a6', NOW())
ON CONFLICT (slug) DO NOTHING;

-- Entities — Players
INSERT INTO "entities" ("id", "slug", "nameEn", "nameFr", "entityType", "country", "active", "createdAt", "updatedAt") VALUES
  ('ent_mbappe',     'kylian-mbappe',    'Kylian Mbappé',             'Kylian Mbappé',             'PLAYER', 'FR', true, NOW(), NOW()),
  ('ent_haaland',    'erling-haaland',   'Erling Haaland',            'Erling Haaland',            'PLAYER', 'NO', true, NOW(), NOW()),
  ('ent_vini',       'vinicius-jr',      'Vinicius Jr',               'Vinicius Jr',               'PLAYER', 'BR', true, NOW(), NOW()),
  ('ent_bellingham', 'jude-bellingham',  'Jude Bellingham',           'Jude Bellingham',           'PLAYER', 'GB', true, NOW(), NOW()),
  ('ent_messi',      'lionel-messi',     'Lionel Messi',              'Lionel Messi',              'PLAYER', 'AR', true, NOW(), NOW()),
  ('ent_ronaldo',    'cristiano-ronaldo','Cristiano Ronaldo',          'Cristiano Ronaldo',         'PLAYER', 'PT', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Entities — Clubs
INSERT INTO "entities" ("id", "slug", "nameEn", "nameFr", "entityType", "country", "active", "createdAt", "updatedAt") VALUES
  ('ent_realmadrid', 'real-madrid',      'Real Madrid',               'Real Madrid',               'CLUB', 'ES', true, NOW(), NOW()),
  ('ent_mancity',    'manchester-city',  'Manchester City',           'Manchester City',            'CLUB', 'GB', true, NOW(), NOW()),
  ('ent_barca',      'barcelona',        'FC Barcelona',              'FC Barcelone',              'CLUB', 'ES', true, NOW(), NOW()),
  ('ent_psg',        'psg',              'Paris Saint-Germain',       'Paris Saint-Germain',        'CLUB', 'FR', true, NOW(), NOW()),
  ('ent_arsenal',    'arsenal',          'Arsenal',                   'Arsenal',                   'CLUB', 'GB', true, NOW(), NOW()),
  ('ent_liverpool',  'liverpool',        'Liverpool',                 'Liverpool',                  'CLUB', 'GB', true, NOW(), NOW()),
  ('ent_inter',      'inter-milan',      'Inter Milan',               'Inter Milan',               'CLUB', 'IT', true, NOW(), NOW()),
  ('ent_juventus',   'juventus',         'Juventus',                  'Juventus',                  'CLUB', 'IT', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Entities — National Teams
INSERT INTO "entities" ("id", "slug", "nameEn", "nameFr", "entityType", "country", "active", "createdAt", "updatedAt") VALUES
  ('ent_canada',    'canada',    'Canada',    'Canada',    'NATIONAL_TEAM', 'CA', true, NOW(), NOW()),
  ('ent_france',    'france',    'France',    'France',    'NATIONAL_TEAM', 'FR', true, NOW(), NOW()),
  ('ent_brazil',    'brazil',    'Brazil',    'Brésil',    'NATIONAL_TEAM', 'BR', true, NOW(), NOW()),
  ('ent_argentina', 'argentina', 'Argentina', 'Argentine', 'NATIONAL_TEAM', 'AR', true, NOW(), NOW()),
  ('ent_england',   'england',   'England',   'Angleterre','NATIONAL_TEAM', 'GB', true, NOW(), NOW()),
  ('ent_spain',     'spain',     'Spain',     'Espagne',   'NATIONAL_TEAM', 'ES', true, NOW(), NOW()),
  ('ent_portugal',  'portugal',  'Portugal',  'Portugal',  'NATIONAL_TEAM', 'PT', true, NOW(), NOW()),
  ('ent_usa',       'usa',       'USA',       'États-Unis','NATIONAL_TEAM', 'US', true, NOW(), NOW()),
  ('ent_mexico',    'mexico',    'Mexico',    'Mexique',   'NATIONAL_TEAM', 'MX', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Entities — Competitions
INSERT INTO "entities" ("id", "slug", "nameEn", "nameFr", "entityType", "active", "createdAt", "updatedAt") VALUES
  ('ent_wc2026', 'world-cup-2026',     'FIFA World Cup 2026',          'Coupe du monde FIFA 2026',     'COMPETITION', true, NOW(), NOW()),
  ('ent_ucl',    'champions-league',   'UEFA Champions League',        'Ligue des champions UEFA',     'COMPETITION', true, NOW(), NOW()),
  ('ent_pl',     'premier-league',     'Premier League',               'Premier League',               'COMPETITION', true, NOW(), NOW()),
  ('ent_laliga', 'la-liga',            'La Liga',                      'La Liga',                      'COMPETITION', true, NOW(), NOW()),
  ('ent_l1',     'ligue-1',            'Ligue 1',                      'Ligue 1',                      'COMPETITION', true, NOW(), NOW()),
  ('ent_seriea', 'serie-a',            'Serie A',                      'Serie A',                      'COMPETITION', true, NOW(), NOW()),
  ('ent_bl',     'bundesliga',         'Bundesliga',                   'Bundesliga',                   'COMPETITION', true, NOW(), NOW()),
  ('ent_copa',   'copa-america',       'Copa América',                 'Copa América',                 'COMPETITION', true, NOW(), NOW()),
  ('ent_euro',   'euro-2028',          'UEFA Euro 2028',               'UEFA Euro 2028',               'COMPETITION', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Demo trend items (aujourd'hui)
INSERT INTO "trend_items" (
  "id", "slug", "titleEn", "titleFr",
  "shortSummaryEn", "shortSummaryFr",
  "whyItMattersEn", "whyItMattersFr",
  "trendScore", "momentum", "editorialPriority", "sourceDiversity", "eventWeight",
  "mustWatch", "featured", "categoryId",
  "publishDate", "createdAt", "updatedAt"
) VALUES
(
  'item_demo1', 'demo-mbappe-freekick',
  'Mbappé''s stunning free-kick silences critics',
  'Le coup franc de Mbappé fait taire les critiques',
  'Kylian Mbappé delivered a masterclass free-kick that has gone viral across social media platforms.',
  'Kylian Mbappé a délivré un coup franc magistral qui est devenu viral sur les réseaux sociaux.',
  'After weeks of scrutiny, this moment shifts the narrative around his form and confidence.',
  'Après des semaines de critiques, ce moment change le récit autour de sa forme et sa confiance.',
  92, 88, 95, 80, 85,
  true, true, 'cat_viral',
  NOW(), NOW(), NOW()
),
(
  'item_demo2', 'demo-transfer-bombshell',
  'Bombshell transfer: top midfielder linked to Premier League',
  'Transfert-bombe : un milieu de classe mondiale lié à la Premier League',
  'Reports confirm advanced negotiations between two top clubs for one of Europe''s best midfielders.',
  'Des rapports confirment des négociations avancées pour l''un des meilleurs milieux d''Europe.',
  'This move could reshape the balance of power in European football before the World Cup.',
  'Ce transfert pourrait redistribuer les cartes du football européen avant la Coupe du monde.',
  78, 72, 80, 65, 70,
  false, false, 'cat_transfer',
  NOW(), NOW(), NOW()
),
(
  'item_demo3', 'demo-worldcup-2026',
  'World Cup 2026: host city buzz heats up',
  'Coupe du monde 2026 : l''effervescence monte dans les villes hôtes',
  'With the tournament approaching, stadiums and cities are ramping up preparations — and fans are excited.',
  'À l''approche du tournoi, stades et villes accélèrent leurs préparatifs — et les fans s''emballent.',
  'Canada co-hosts its first World Cup. The buzz is building fast.',
  'Le Canada co-organise sa première Coupe du monde. L''engouement monte vite.',
  85, 90, 88, 75, 95,
  false, true, 'cat_wc2026',
  NOW(), NOW(), NOW()
),
(
  'item_demo4', 'demo-haaland-record',
  'Haaland chasing historic goalscoring record',
  'Haaland à la poursuite d''un record historique de buts',
  'Erling Haaland is just 3 goals away from breaking the all-time Premier League single-season record.',
  'Erling Haaland n''est plus qu''à 3 buts du record de buts en une seule saison de Premier League.',
  'If he breaks it, it will be one of the most talked-about moments of the season.',
  'S''il le bat, ce sera l''un des moments les plus marquants de la saison.',
  88, 85, 90, 78, 80,
  true, false, 'cat_viral',
  NOW(), NOW(), NOW()
),
(
  'item_demo5', 'demo-champions-league-semis',
  'Champions League semi-final draw: explosive matchups revealed',
  'Tirage demi-finales Ligue des champions : des affiches explosives',
  'The draw has set up two blockbuster semi-finals that have fans buzzing worldwide.',
  'Le tirage a offert deux demi-finales de gala qui font vibrer les fans du monde entier.',
  'The stakes couldn''t be higher — the road to the final runs through these four clubs.',
  'Les enjeux n''ont jamais été aussi élevés — la route vers la finale passe par ces quatre clubs.',
  95, 92, 98, 90, 92,
  false, true, 'cat_matches',
  NOW(), NOW(), NOW()
)
ON CONFLICT (slug) DO NOTHING;
