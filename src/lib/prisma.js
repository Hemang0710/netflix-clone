import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const globalForPrisma = globalThis

const getPrisma = () => {
  //Connection pool - optimized settings for better timeout handling
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 15, // Increased from 10
    min: 2, // Maintain minimum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000, // Reduced from 100000 to fail faster
    statement_timeout: 30000, // 30 second statement timeout
    query_timeout: 30000, // 30 second query timeout
  })
  const adapter = new PrismaPg (pool)
  return new PrismaClient({adapter})
}

const prisma = globalForPrisma.prisma ?? getPrisma()

if(process.env.NODE_ENV !== "production"){
  globalForPrisma.prisma = prisma
}

export default prisma