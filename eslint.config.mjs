// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        {
          name: 'chart.js',
          message: 'Use @unovis/vue for all visualizations.'
        },
        {
          name: 'vue-chartjs',
          message: 'Use @unovis/vue for all visualizations.'
        },
        {
          name: 'dayjs',
          message: 'Use NuxtTime for date/time rendering instead of dayjs.'
        }
      ],
      patterns: [
        {
          group: ['chart.js/*', 'vue-chartjs/*', 'dayjs/*'],
          message: 'This import is blocked by frontend standards policy.'
        }
      ]
    }],
    'vue/no-multiple-template-root': 'off',
    'vue/max-attributes-per-line': ['error', { singleline: 3 }]
  }
})
