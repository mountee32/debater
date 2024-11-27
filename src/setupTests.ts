import '@testing-library/jest-dom';

// Mock ci-info to prevent the "vendors.map is not a function" error
jest.mock('ci-info', () => ({
  isCI: false,
  name: null,
  isPR: false,
  vendors: []
}));
