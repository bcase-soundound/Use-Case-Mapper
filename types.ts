
export interface Message {
  role: 'user' | 'agent' | 'system';
  text: string;
  timestamp?: string | number;
}

export interface ConversationMetadata {
  userId?: string | null;
  agentId?: string;
  duration?: number;
  tags?: string[];
  sentiment?: string;
  channel?: string;
  userName?: string;
  initialChannel?: string;
  resolutionStatus?: string;
  satisfactionScore?: number;
  topics?: Array<{
    topicName: string;
    explanation: string;
    resolutionStatus: string;
  }>;
  metrics?: Array<{
    code: string;
    value: any;
  }>;
  [key: string]: any;
}

export interface Conversation {
  id: string | number;
  timestamp: string;
  messages: Message[];
  metadata?: ConversationMetadata;
}

export interface ConversationReport {
  reportId?: string;
  generatedAt?: string;
  conversations: Conversation[];
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface EngineSettings {
  model: string;
  batchSize: number;
  rpm: number;
}

export interface AnalysisResult {
  summary: string;
  identifiedUseCases: Array<{
    vertical: string;
    audience: string;
    task: string;
    channel: string;
    description: string;
    count: number;
  }>;
  commonPatterns: Array<{
    title: string;
    description: string;
    frequency: 'High' | 'Medium' | 'Low';
  }>;
  topIssues: string[];
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  keyTakeaways: string[];
  suggestedImprovements: string[];
}
