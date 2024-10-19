export interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  subject: string;
  category: string;
}

export const leaderboardData: LeaderboardEntry[] = [
  // Religion
  {
    id: 1,
    username: "faithSeeker",
    score: 95,
    subject: "Does science disprove religion?",
    category: "Religion"
  },
  {
    id: 2,
    username: "spiritualExplorer",
    score: 92,
    subject: "Can different religions coexist peacefully?",
    category: "Religion"
  },
  {
    id: 3,
    username: "theologian101",
    score: 88,
    subject: "Should religious symbols be allowed in public schools?",
    category: "Religion"
  },
  {
    id: 4,
    username: "beliefAnalyst",
    score: 85,
    subject: "Is morality dependent on religion?",
    category: "Religion"
  },
  {
    id: 5,
    username: "faithPhilosopher",
    score: 82,
    subject: "Do all religions share common core values?",
    category: "Religion"
  },

  // Politics
  {
    id: 6,
    username: "policyWonk",
    score: 94,
    subject: "Should there be term limits for elected officials?",
    category: "Politics"
  },
  {
    id: 7,
    username: "constitutionDefender",
    score: 91,
    subject: "Should the Supreme Court have term limits?",
    category: "Politics"
  },
  {
    id: 8,
    username: "diplomacyPro",
    score: 89,
    subject: "Is the United Nations effective in maintaining global peace?",
    category: "Politics"
  },
  {
    id: 9,
    username: "electionReformer",
    score: 86,
    subject: "Should voting be mandatory?",
    category: "Politics"
  },
  {
    id: 10,
    username: "globalStrategist",
    score: 84,
    subject: "Is economic sanctions an effective foreign policy tool?",
    category: "Politics"
  },

  // Science
  {
    id: 11,
    username: "scienceAdvocate",
    score: 96,
    subject: "Should we prioritize space exploration over ocean exploration?",
    category: "Science"
  },
  {
    id: 12,
    username: "techGuru",
    score: 93,
    subject: "Is artificial intelligence a threat to humanity?",
    category: "Science"
  },
  {
    id: 13,
    username: "climateExpert",
    score: 90,
    subject: "Is nuclear energy the solution to climate change?",
    category: "Science"
  },
  {
    id: 14,
    username: "bioethicist",
    score: 87,
    subject: "Should human genetic engineering be allowed?",
    category: "Science"
  },
  {
    id: 15,
    username: "quantumThinker",
    score: 85,
    subject: "Will quantum computing revolutionize technology?",
    category: "Science"
  },

  // Philosophy
  {
    id: 16,
    username: "logicMaster",
    score: 97,
    subject: "Is euthanasia morally justifiable?",
    category: "Philosophy"
  },
  {
    id: 17,
    username: "ethicsExplorer",
    score: 94,
    subject: "Is it ever morally acceptable to lie?",
    category: "Philosophy"
  },
  {
    id: 18,
    username: "mindPhilosopher",
    score: 91,
    subject: "Does free will exist?",
    category: "Philosophy"
  },
  {
    id: 19,
    username: "realityQuestioner",
    score: 88,
    subject: "Is our reality a simulation?",
    category: "Philosophy"
  },
  {
    id: 20,
    username: "moralCompass",
    score: 86,
    subject: "Are there universal moral truths?",
    category: "Philosophy"
  },

  // Random
  {
    id: 21,
    username: "wildCardArguer",
    score: 93,
    subject: "Is cereal a soup?",
    category: "Random"
  },
  {
    id: 22,
    username: "quirkDebater",
    score: 90,
    subject: "Should pineapple be allowed on pizza?",
    category: "Random"
  },
  {
    id: 23,
    username: "randomThinker",
    score: 87,
    subject: "Is a hotdog a sandwich?",
    category: "Random"
  },
  {
    id: 24,
    username: "unconventionalLogic",
    score: 84,
    subject: "If you punch yourself and it hurts, are you strong or weak?",
    category: "Random"
  },
  {
    id: 25,
    username: "absurdistDebater",
    score: 82,
    subject: "Would you rather fight 100 duck-sized horses or 1 horse-sized duck?",
    category: "Random"
  }
];
