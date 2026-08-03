import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = 'https://api.aatos.io/v1'; // Production URL
// const API_BASE_URL = 'http://localhost:3000/v1'; // Development

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export interface RFQ {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  targetPrice: number;
  currency: string;
  destination: string;
  status: 'open' | 'quoted' | 'closed';
  createdAt: string;
}

export interface Deal {
  id: string;
  productName: string;
  quantity: number;
  totalValue: number;
  currency: string;
  status: string;
  buyerOrgName: string;
  supplierOrgName: string;
  milestones: Array<{
    id: string;
    name: string;
    status: string;
    dueDate: string;
  }>;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  dealId?: string;
}

export const rfqApi = {
  getAll: () => api.get<RFQ[]>('/rfqs'),
  create: (data: Omit<RFQ, 'id' | 'createdAt' | 'status'>) => api.post<RFQ>('/rfqs', data),
};

export const dealsApi = {
  getAll: () => api.get<Deal[]>('/deals'),
  getById: (id: string) => api.get<Deal>(`/deals/${id}`),
  updateMilestone: (dealId: string, milestoneId: string, status: string) =>
    api.patch(`/deals/${dealId}/milestones/${milestoneId}`, { status }),
};

export const messagesApi = {
  getAll: () => api.get<Message[]>('/messages'),
  send: (data: { content: string; dealId?: string }) => api.post<Message>('/messages', data),
};
