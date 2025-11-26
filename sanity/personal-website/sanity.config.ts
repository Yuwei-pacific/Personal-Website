import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'personal website',

  projectId: 'ubdc9y57',
  dataset: 'personal_website',

  // Only structure tool is included to avoid pulling in the vision plugin during app build
  plugins: [structureTool()],

  schema: {
    types: schemaTypes,
  },
})
