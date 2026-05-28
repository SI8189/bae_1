export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
  relatedArticles?: string[];
}

export interface SuggestedQuestion {
  id: string;
  text: string;
  shortText: string;
  description: string;
}
