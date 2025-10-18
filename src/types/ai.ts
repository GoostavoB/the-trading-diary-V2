export interface AIAnalysisResult {
  patterns: {
    winning_patterns: string[];
    losing_patterns: string[];
    time_based_insights: string[];
  };
  insights: {
    behavioral: string[];
    emotional: string[];
    performance: string[];
  };
  risks: {
    current_risks: string[];
    risk_score: number;
    recommendations: string[];
  };
  suggestions: {
    immediate: string[];
    long_term: string[];
    optimization: string[];
  };
  encouragement: string;
}

export interface AITradeAnalysis {
  execution_quality: number; // 0-100
  mistakes: string[];
  improvements: string[];
  emotional_analysis: string;
  risk_assessment: string;
  alternative_actions: string[];
}

export interface AIPatternRecognition {
  identified_patterns: Array<{
    name: string;
    description: string;
    win_rate: number;
    occurrences: number;
    examples: string[];
  }>;
  recommendations: string[];
}

export interface AIChatMessage {
  id: string;
  user_id: string;
  message: string;
  response: string;
  context: any;
  created_at: string;
}
