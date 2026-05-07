import { defineField, defineType } from 'sanity'

export const resume = defineType({
  name: 'education',
  title: 'Resume (Edu & Exp)',
  type: 'document',
  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Education', value: 'education' },
          { title: 'Experience', value: 'experience' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
      initialValue: 'education'
    }),
    defineField({
      name: 'institution',
      title: 'Institution / Company',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'degree',
      title: 'Degree / Role',
      type: 'string',
    }),
    defineField({
      name: 'period',
      title: 'Period',
      type: 'string',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
    }),
    defineField({
      name: 'details',
      title: 'Details',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Additional details to show when expanded (e.g. coursework, honors, thesis)',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Used to sort the entries (e.g. 99 for most recent, larger numbers appear higher)',
    }),
  ],
  preview: {
    select: {
      title: 'institution',
      subtitle: 'degree',
    },
  },
})
