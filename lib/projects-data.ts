export interface Project {
  id: string
  name: string
  category: string
  description: string
  tech: string[]
  status: 'live' | 'in-progress' | 'concept'
  url?: string
  github?: string
}

// Edit freely — this is the single place Home Office content comes from.
// Names/descriptions are placeholders pending final copy. Facts that also appear
// in lib/portfolio-projects.ts (status, live URL, what a project is) must agree
// with it — scripts/validate-portfolio.mjs checks the overlap.
export const HOME_OFFICE_PROJECTS: Project[] = [
  {
    id: 'stack-house',
    name: 'The Stack House',
    category: 'This Site',
    description: 'A first-person portfolio built as a walkable house — you\'re standing in it.',
    tech: ['Next.js', 'React Three Fiber', 'Three.js', 'Zustand'],
    status: 'in-progress',
  },
  {
    id: 'sbm-inc',
    name: 'SBM Inc.',
    category: 'Client Work',
    description: 'Client site for a Florida nonprofit empowering BIPOC youth.',
    tech: ['Next.js', 'Tailwind'],
    status: 'live',
    url: 'https://sbminc.org/',
  },
  {
    id: 'app-triage',
    name: 'App Triage',
    category: 'Dev Tools',
    description: 'Internal tool for organizing and triaging in-flight app ideas.',
    tech: ['Next.js', 'TypeScript'],
    status: 'in-progress',
    url: 'https://at-test.greykeystudios.workers.dev/',
  },
  {
    id: 'relearn',
    name: 'ReLearn',
    category: 'Learning',
    description: 'AI-assisted relearning and study tool in development — intended to become the learning engine behind Bridge Academy.',
    tech: [],
    status: 'in-progress',
    url: 'https://rltest.greykeystudios.dev/',
  },
  {
    id: 'grey-key-studios',
    name: 'Grey Key Studios',
    category: 'Creative Studio',
    // A studio/label, not an alias: the artist personas (Mr. E, Adwo Nyumbani,
    // Walton Grey, ...) are separate identities presented under it.
    description: 'Independent studio home for music, artist identities, experiments and creative technology — see the basement.',
    tech: [],
    status: 'live',
    url: 'https://www.greykeystudios.com/',
  },
]
