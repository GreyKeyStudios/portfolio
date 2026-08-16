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
// Names/descriptions are placeholders pending final copy.
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
    description: 'Client-facing marketing site and event pages.',
    tech: ['Next.js', 'Tailwind'],
    status: 'live',
  },
  {
    id: 'app-triage',
    name: 'App Triage',
    category: 'Dev Tools',
    description: 'Internal tool for organizing and triaging in-flight app ideas.',
    tech: ['Next.js', 'TypeScript'],
    status: 'in-progress',
  },
  {
    id: 'relearn',
    name: 'ReLearn',
    category: 'AI / Software',
    description: 'Concept for an AI-assisted relearning/study tool.',
    tech: ['TBD'],
    status: 'concept',
  },
  {
    id: 'prompt-pilot',
    name: 'Prompt Pilot',
    category: 'AI / Software',
    description: 'Prompt engineering / agent workflow concept.',
    tech: ['TBD'],
    status: 'concept',
  },
  {
    id: 'grey-key-studios',
    name: 'Grey Key Studios',
    category: 'Music',
    description: "Michael's music production alias — see the basement.",
    tech: [],
    status: 'live',
  },
]
