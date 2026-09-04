/** Single source of truth for routes. No path literals anywhere else. */
export const paths = {
  home: () => '/',
  onboarding: () => '/onboarding',
  study: (sessionId: string) => `/study/${sessionId}`,
  learn: () => '/learn',
  topic: (topicId: string) => `/learn/${topicId}`,
  practice: (topicId: string) => `/practice/${topicId}`,
  review: () => '/review',
  homework: () => '/homework',
  material: (materialId: string) => `/homework/${materialId}`,
  chat: (threadId: string) => `/chat/${threadId}`,
  settings: () => '/settings',
  parent: () => '/parent',
  devGenerators: () => '/dev/generators',
} as const;
