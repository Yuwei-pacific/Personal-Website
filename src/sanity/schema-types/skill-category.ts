import { defineField, defineType } from 'sanity'

export const skillCategory = defineType({
  name: 'skillCategory',
  title: 'Skill Category',
  type: 'document',
  fields: [
    defineField({
      name: 'titleTranslations',
      title: 'Category title',
      type: 'localizedString',
      description: 'Italian and English display labels for this capability group.',
      validation: (rule) => rule.required(),
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
  preview: {
    select: {
      titleIt: 'titleTranslations.it',
      titleEn: 'titleTranslations.en',
      order: 'order',
    },
    prepare({titleIt, titleEn, order}) {
      return {
        title: titleIt || titleEn || 'Untitled skill category',
        subtitle: typeof order === 'number' ? `Order ${order}` : undefined,
      }
    },
  },
})
