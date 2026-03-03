import axios from 'axios';

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  // If it's a relative path starting with /api, or an absolute path ending with /api, 
  // we return it as is but we'll need to be careful with the endpoints.
  // Better yet: just make it clean.
  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Store token getter function
let tokenGetter: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  tokenGetter = getter;
};

// Add auth token to requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Add request interceptor to ensure fresh token
api.interceptors.request.use(
  async (config) => {
    if (tokenGetter) {
      try {
        const token = await tokenGetter();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get token:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Explain Module API
export const explainAPI = {
  sendMessage: async (message: string, difficulty: string, conversationId?: string) => {
    const { data } = await api.post('/api/explain', {
      message,
      difficulty,
      conversationId,
    });
    return data;
  },

  getHistory: async () => {
    const { data } = await api.get('/api/explain/history');
    return data;
  },

  getConversation: async (id: string) => {
    const { data } = await api.get(`/api/explain/${id}`);
    return data;
  },

  deleteConversation: async (id: string) => {
    const { data } = await api.delete(`/api/explain/${id}`);
    return data;
  },
};

// Quiz Module API
export const quizAPI = {
  generateQuiz: async (topic: string, difficulty: string, questionCount: number = 5) => {
    const { data } = await api.post('/api/quiz/generate', {
      topic,
      difficulty,
      questionCount,
    });
    return data;
  },

  submitQuiz: async (quizId: string, answers: Record<string, string>) => {
    const { data } = await api.post('/api/quiz/submit', {
      quizId,
      answers,
    });
    return data;
  },

  getHistory: async () => {
    const { data } = await api.get('/api/quiz/history');
    return data;
  },

  getQuiz: async (id: string) => {
    const { data } = await api.get(`/api/quiz/${id}`);
    return data;
  },

  deleteQuiz: async (id: string) => {
    const { data } = await api.delete(`/api/quiz/${id}`);
    return data;
  },
};

// Summarize Module API
export const summarizeAPI = {
  createSummary: async (content: string, title: string, sourceType: string = 'text') => {
    const { data } = await api.post('/api/summarize', {
      content,
      title,
      sourceType,
    });
    return data;
  },

  getHistory: async () => {
    const { data } = await api.get('/api/summarize/history');
    return data;
  },

  getSummary: async (id: string) => {
    const { data } = await api.get(`/api/summarize/${id}`);
    return data;
  },

  deleteSummary: async (id: string) => {
    const { data } = await api.delete(`/api/summarize/${id}`);
    return data;
  },
};

// Flashcard Module API
export const flashcardAPI = {
  generateFlashcards: async (topic: string, count: number = 10, content?: string) => {
    const { data } = await api.post('/api/flashcard/generate', {
      topic,
      count,
      content,
    });
    return data;
  },

  getSets: async () => {
    const { data } = await api.get('/api/flashcard/sets');
    return data;
  },

  getSet: async (id: string) => {
    const { data } = await api.get(`/api/flashcard/sets/${id}`);
    return data;
  },

  updateCard: async (id: string, mastered: boolean) => {
    const { data } = await api.patch(`/api/flashcard/cards/${id}`, {
      mastered,
    });
    return data;
  },

  deleteSet: async (id: string) => {
    const { data } = await api.delete(`/api/flashcard/sets/${id}`);
    return data;
  },
};

// Upload API
export const uploadAPI = {
  uploadPDF: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/api/upload/pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  extractPDF: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/api/upload/pdf/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};

export default api;
