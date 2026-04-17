import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const globalForPrisma = globalThis

const getPrisma = () => {
  //Connection pool - max 10 connections
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 100000,
  })
  const adapter = new PrismaPg (pool)
  return new PrismaClient({adapter})
}

const prisma = globalForPrisma.prisma ?? getPrisma()

if(process.env.NODE_ENV !== "production"){
  globalForPrisma.prisma = prisma
}

export default prisma