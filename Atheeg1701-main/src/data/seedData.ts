import { Test, Candidate, AppSettings } from '../types';
import { ADMIN_LOGIN_CONFIG } from '../config/env';

export const ADMIN_CREDENTIALS = {
  email: ADMIN_LOGIN_CONFIG.email,
  password: ADMIN_LOGIN_CONFIG.password
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  proctoringEnabled: true,
  strictTabSwitchLimit: 1,
  autoEndOnTabSwitch: true,
  capturePhotoOnTabSwitch: true
};

export const SEED_CANDIDATE: Candidate = {
  id: "cand_seed_1",
  name: "Alex Mercer",
  email: "test@atheeg.com",
  phone: "9876543210",
  // Note: In production, hash with bcrypt on backend
  password: "test123",
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
};

export const SEED_TEST: Test = {
  id: "test_gk_demo",
  title: "General Knowledge Demo",
  description: "A comprehensive baseline assessment covering fundamental sciences, modern computing, and general logic.",
  code: "ATH-GK101",
  duration: 10, // 10 minutes total
  published: true,
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  levels: [
    {
      id: "lvl_1",
      name: "Level 1: Fundamentals",
      timeLimit: 5,
      questions: [
        {
          id: "q_101",
          text: "Which planet in our solar system is known as the 'Red Planet'?",
          options: ["Venus", "Mars", "Jupiter", "Saturn"],
          correctIndex: 1,
          explanation: "Mars appears reddish because of widespread iron oxide (rust) on its surface and thin atmospheric dust.",
          difficulty: "Easy"
        },
        {
          id: "q_102",
          text: "What is the chemical element symbol for Gold on the periodic table?",
          options: ["Ag", "Au", "Fe", "Gd"],
          correctIndex: 1,
          explanation: "Au originates from 'Aurum', the Latin word for gold, signifying 'shining dawn'.",
          difficulty: "Easy"
        },
        {
          id: "q_103",
          text: "Who formulated the Theory of General Relativity published in 1915?",
          options: ["Isaac Newton", "Albert Einstein", "Niels Bohr", "Galileo Galilei"],
          correctIndex: 1,
          explanation: "Albert Einstein developed General Relativity, redefining gravity as the curvature of spacetime.",
          difficulty: "Medium"
        }
      ]
    },
    {
      id: "lvl_2",
      name: "Level 2: Advanced Reasoning",
      timeLimit: 5,
      questions: [
        {
          id: "q_201",
          text: "In internet networking protocols, what does the acronym 'HTTP' stand for?",
          options: [
            "HyperText Transmission Program",
            "HyperText Transfer Protocol",
            "High Traffic Testing Protocol",
            "Hybrid Terminal Transfer Pack"
          ],
          correctIndex: 1,
          explanation: "HTTP stands for HyperText Transfer Protocol, the foundational application-layer protocol for distributed hypermedia systems.",
          difficulty: "Medium"
        },
        {
          id: "q_202",
          text: "What is the primary biochemical role of mitochondria within eukaryotic cells?",
          options: [
            "Photosynthesis and chlorophyll formation",
            "Cellular energy production via ATP synthesis",
            "Protein synthesis and RNA translation",
            "Lipid filtration and cell wall hardening"
          ],
          correctIndex: 1,
          explanation: "Mitochondria generate most of the chemical energy required for cellular biochemical reactions in the form of Adenosine Triphosphate (ATP).",
          difficulty: "Hard"
        }
      ]
    }
  ]
};
