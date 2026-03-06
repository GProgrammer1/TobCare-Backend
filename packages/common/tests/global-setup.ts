/**
 * Jest global setup — runs ONCE before all test suites.
 * Ensures the test database has the latest schema.
 */
import { execSync } from "node:child_process"

export default async function globalSetup() {
  process.env.NODE_ENV = "test"

  // Run prisma migrate deploy against the test database
  execSync(
    "npx prisma migrate deploy",
    {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: "postgresql://test:test@localhost:5433/tobcare_test",
      },
    },
  )
}
