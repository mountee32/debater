const getEnvVar = (key: string, defaultValue?: string): string => {
  if (process.env.NODE_ENV === 'test') {
    return process.env[key] || defaultValue || '';
  }
  return (import.meta.env[key] as string) || defaultValue || '';
};

export const env = {
  OPENROUTER_API_KEY: getEnvVar('VITE_OPENROUTER_API_KEY'),
  OPPONENT_MODEL: getEnvVar('VITE_OPPONENT_MODEL'),
  HINT_MODEL: getEnvVar('VITE_HINT_MODEL'),
  TURN_SCORING_MODEL: getEnvVar('VITE_TURN_SCORING_MODEL'),
  FINAL_SCORING_MODEL: getEnvVar('VITE_FINAL_SCORING_MODEL'),
};
