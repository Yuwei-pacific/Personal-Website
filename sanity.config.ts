import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './sanity/schemaTypes'

export default defineConfig({
  basePath: '/studio', // Required for embedded studio
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ubdc9y57',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'personal_website',

  plugins: [structureTool()],

  schema: {
    types: schemaTypes,
  },
})
