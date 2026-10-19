import 'dotenv/config'
import { getPayload } from 'payload'
import config from './payload.config'
import { seedDatabase } from './lib/seedData'

async function seed() {
  const payload = await getPayload({ config: await config })
  payload.logger.info('Seeding…')
  const result = await seedDatabase(payload)
  payload.logger.info(
    `Seed abgeschlossen ✔ (${result.vehicles} Fahrzeuge, ${result.users} Personen, ` +
      `${result.keys} Schliessungen / ${result.keyCopies} Exemplare, ${result.keyBundles} Bünde, ` +
      `${result.keyDepots} Verwahrungen)`,
  )
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
