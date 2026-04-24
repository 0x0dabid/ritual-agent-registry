export interface Agent {
  address: string;
  owner: string;
  name: string;
  endpoint?: string;
  codeHash?: string;
  capabilities: string[];
  metadataURI?: string;
  registeredAt: number;
  lastHeartbeat?: number;
  active?: boolean;
}

export interface Reputation {
  reliability: number;
  speed: number;
  quality: number;
  costEfficiency: number;
}

export interface RegisterForm {
  name: string;
  endpoint: string;
  codeFile: File | null;
  capabilities: string[];
  metadataURI: string;
}
