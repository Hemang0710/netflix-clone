import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.watchlist.deleteMany()
  await prisma.movie.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.user.deleteMany()

  await prisma.movie.createMany({
    data: [
      { title: "Inception", description: "A thief who enters dreams", genre: "Sci-Fi", year: 2010, rating: 8.8 },
      { title: "The Dark Knight", description: "Batman vs Joker", genre: "Action", year: 2008, rating: 9.0 },
      { title: "Interstellar", description: "Journey beyond the galaxy", genre: "Sci-Fi", year: 2014, rating: 8.6 },
    ],
  })

  console.log("Database seeded")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())