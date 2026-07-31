import { defineField, defineType } from 'sanity'

export const skillCategory = defineType({
  name: 'skillCategory',
  title: 'Skill Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Category Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'titleTranslations',
      title: 'Category title translations',
      type: 'localizedString',
      description: 'Italian and English display labels for this capability group.',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Used to sort the categories (e.g. 1, 2, 3)',
    }),
    defineField({
      name: 'skills',
      title: 'Skills',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      }
    }),
  ],
})
