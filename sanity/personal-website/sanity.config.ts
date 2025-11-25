import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'personal website',

  projectId: 'ubdc9y57',
  dataset: 'personal_website',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
