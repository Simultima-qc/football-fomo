import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  host: "aws-0-us-east-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.tylqfadiaarezpufhrmf",
  password: process.env.DB_PASSWORD!,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  // Categories
  const categories = [
    { slug: "viral-moments", nameEn: "Viral Moments", nameFr: "Moments viraux", color: "#ef4444" },
    { slug: "transfers", nameEn: "Transfers", nameFr: "Transferts", color: "#f59e0b" },
    { slug: "matches", nameEn: "Matches", nameFr: "Matchs", color: "#3b82f6" },
    { slug: "national-teams", nameEn: "National Teams", nameFr: "Équipes nationales", color: "#8b5cf6" },
    { slug: "club-football", nameEn: "Club Football", nameFr: "Football de club", color: "#10b981" },
    { slug: "world-cup-2026", nameEn: "World Cup 2026", nameFr: "Coupe du monde 2026", color: "#f97316" },
    { slug: "controversies", nameEn: "Controversies", nameFr: "Polémiques", color: "#ec4899" },
    { slug: "injuries", nameEn: "Injuries", nameFr: "Blessures", color: "#6b7280" },
    { slug: "social-buzz", nameEn: "Social Buzz", nameFr: "Buzz social", color: "#14b8a6" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✓ ${categories.length} categories`);

  // Key entities
  const entities = [
    { slug: "kylian-mbappe", nameEn: "Kylian Mbappé", nameFr: "Kylian Mbappé", entityType: "PLAYER" as const, country: "FR" },
    { slug: "erling-haaland", nameEn: "Erling Haaland", nameFr: "Erling Haaland", entityType: "PLAYER" as const, country: "NO" },
    { slug: "vinicius-jr", nameEn: "Vinicius Jr", nameFr: "Vinicius Jr", entityType: "PLAYER" as const, country: "BR" },
    { slug: "jude-bellingham", nameEn: "Jude Bellingham", nameFr: "Jude Bellingham", entityType: "PLAYER" as const, country: "GB" },
    { slug: "lionel-messi", nameEn: "Lionel Messi", nameFr: "Lionel Messi", entityType: "PLAYER" as const, country: "AR" },
    { slug: "cristiano-ronaldo", nameEn: "Cristiano Ronaldo", nameFr: "Cristiano Ronaldo", entityType: "PLAYER" as const, country: "PT" },
    { slug: "real-madrid", nameEn: "Real Madrid", nameFr: "Real Madrid", entityType: "CLUB" as const, country: "ES" },
    { slug: "manchester-city", nameEn: "Manchester City", nameFr: "Manchester City", entityType: "CLUB" as const, country: "GB" },
    { slug: "barcelona", nameEn: "FC Barcelona", nameFr: "FC Barcelone", entityType: "CLUB" as const, country: "ES" },
    { slug: "psg", nameEn: "Paris Saint-Germain", nameFr: "Paris Saint-Germain", entityType: "CLUB" as const, country: "FR" },
    { slug: "arsenal", nameEn: "Arsenal", nameFr: "Arsenal", entityType: "CLUB" as const, country: "GB" },
    { slug: "canada", nameEn: "Canada", nameFr: "Canada", entityType: "NATIONAL_TEAM" as const, country: "CA" },
    { slug: "france", nameEn: "France", nameFr: "France", entityType: "NATIONAL_TEAM" as const, country: "FR" },
    { slug: "brazil", nameEn: "Brazil", nameFr: "Brésil", entityType: "NATIONAL_TEAM" as const, country: "BR" },
    { slug: "argentina", nameEn: "Argentina", nameFr: "Argentine", entityType: "NATIONAL_TEAM" as const, country: "AR" },
    { slug: "world-cup-2026", nameEn: "FIFA World Cup 2026", nameFr: "Coupe du monde FIFA 2026", entityType: "COMPETITION" as const },
    { slug: "champions-league", nameEn: "UEFA Champions League", nameFr: "Ligue des champions UEFA", entityType: "COMPETITION" as const },
    { slug: "premier-league", nameEn: "Premier League", nameFr: "Premier League", entityType: "COMPETITION" as const, country: "GB" },
    { slug: "la-liga", nameEn: "La Liga", nameFr: "La Liga", entityType: "COMPETITION" as const, country: "ES" },
    { slug: "ligue-1", nameEn: "Ligue 1", nameFr: "Ligue 1", entityType: "COMPETITION" as const, country: "FR" },
  ];

  for (const entity of entities) {
    await prisma.entity.upsert({
      where: { slug: entity.slug },
      update: {},
      create: entity,
    });
  }
  console.log(`✓ ${entities.length} entities`);

  // Seed trend items for today (demo)
  const today = new Date();
  const transferCat = await prisma.category.findUnique({ where: { slug: "transfers" } });
  const viralCat = await prisma.category.findUnique({ where: { slug: "viral-moments" } });
  const wcCat = await prisma.category.findUnique({ where: { slug: "world-cup-2026" } });

  const demoItems = [
    {
      slug: `demo-mbappe-${today.toISOString().split("T")[0]}`,
      titleEn: "Mbappé's stunning free-kick silences critics",
      titleFr: "Le coup franc de Mbappé fait taire les critiques",
      shortSummaryEn: "Kylian Mbappé delivered a masterclass free-kick that has gone viral across social media platforms.",
      shortSummaryFr: "Kylian Mbappé a délivré un coup franc magistral qui est devenu viral sur les réseaux sociaux.",
      whyItMattersEn: "After weeks of scrutiny, this moment shifts the narrative around his form and confidence.",
      whyItMattersFr: "Après des semaines de critiques, ce moment change le récit autour de sa forme et sa confiance.",
      trendScore: 92, momentum: 88, editorialPriority: 95, sourceDiversity: 80, eventWeight: 85,
      mustWatch: true, featured: true,
      categoryId: viralCat?.id,
    },
    {
      slug: `demo-transfer-${today.toISOString().split("T")[0]}`,
      titleEn: "Bombshell transfer: top midfielder linked to Premier League",
      titleFr: "Transfert-bombe : un milieu de classe mondiale lié à la Premier League",
      shortSummaryEn: "Reports confirm advanced negotiations between two top clubs for one of Europe's best midfielders.",
      shortSummaryFr: "Des rapports confirment des négociations avancées entre deux grands clubs pour l'un des meilleurs milieux d'Europe.",
      whyItMattersEn: "This move could reshape the balance of power in European football before the World Cup.",
      whyItMattersFr: "Ce transfert pourrait redistribuer les cartes du football européen avant la Coupe du monde.",
      trendScore: 78, momentum: 72, editorialPriority: 80, sourceDiversity: 65, eventWeight: 70,
      mustWatch: false, featured: false,
      categoryId: transferCat?.id,
    },
    {
      slug: `demo-worldcup-${today.toISOString().split("T")[0]}`,
      titleEn: "World Cup 2026: host city buzz heats up",
      titleFr: "Coupe du monde 2026 : l'effervescence monte dans les villes hôtes",
      shortSummaryEn: "With the tournament approaching, stadiums and cities are ramping up preparations — and fans are excited.",
      shortSummaryFr: "À l'approche du tournoi, stades et villes accélèrent leurs préparatifs — et les fans s'emballent.",
      whyItMattersEn: "Canada co-hosts its first World Cup. The buzz is building fast.",
      whyItMattersFr: "Le Canada co-organise sa première Coupe du monde. L'engouement monte vite.",
      trendScore: 85, momentum: 90, editorialPriority: 88, sourceDiversity: 75, eventWeight: 95,
      mustWatch: false, featured: true,
      categoryId: wcCat?.id,
    },
  ];

  for (const item of demoItems) {
    await prisma.trendItem.upsert({
      where: { slug: item.slug },
      update: {},
      create: item,
    });
  }
  console.log(`✓ ${demoItems.length} demo trend items`);

  console.log("\n🏆 Seed terminé avec succès !");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
