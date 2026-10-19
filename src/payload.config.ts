import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { de } from '@payloadcms/translations/languages/de'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Vehicles } from './collections/Vehicles'
import { Categories } from './collections/Categories'
import { LockingSystems } from './collections/LockingSystems'
import { KeyCategories } from './collections/KeyCategories'
import { KeyDepots } from './collections/KeyDepots'
import { Keys } from './collections/Keys'
import { KeyCopies } from './collections/KeyCopies'
import { KeyBundles } from './collections/KeyBundles'
import { KeyEvents } from './collections/KeyEvents'
import { KeyIncidents } from './collections/KeyIncidents'
import { KeyInventories } from './collections/KeyInventories'
import { Branding } from './globals/Branding'
import { resetEndpoint } from './endpoints/reset'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      title: 'Fahrzeug- und Schlüsselverwaltung',
      titleSuffix: '— Schweizer Armee',
    },
    components: {
      afterDashboard: ['/components/admin/ResetTool#ResetTool'],
    },
  },
  collections: [
    Vehicles,
    Categories,
    Keys,
    KeyCopies,
    KeyBundles,
    KeyIncidents,
    KeyInventories,
    KeyCategories,
    KeyDepots,
    LockingSystems,
    KeyEvents,
    Users,
    Media,
  ],
  globals: [Branding],
  endpoints: [resetEndpoint],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./saf-fleet.db',
    },
  }),
  sharp,
  i18n: {
    supportedLanguages: { de, en },
    fallbackLanguage: 'de',
  },
})
