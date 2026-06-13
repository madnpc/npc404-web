export type DemoActionId =
  | 'talk-lin-doctor'
  | 'search-pharmacy'
  | 'give-medicine'
  | 'guard-shelter'

export interface DemoAction {
  id: DemoActionId
  label: string
  description: string
  tone: 'talk' | 'search' | 'aid' | 'defense'
}

export interface DemoEvent {
  id?: string
  turn?: number
  type: string
  visibility?: 'public' | 'private' | 'server'
  description?: string
  payload?: Record<string, string | number | boolean>
}

export interface DemoNpcState {
  id: string
  name: string
  role: string
  trust: number
  pressure: number
  abnormalityStage: 'controlled' | 'tense' | 'unstable'
}

export interface DemoState {
  worldId: string
  turn: number
  day: number
  location: string
  resources: {
    food: number
    water: number
    medicine: number
  }
  shelter: {
    safety: number
    generatorFixed: boolean
  }
  npcs: Record<'lin-doctor' | 'captain-zhao', DemoNpcState>
  flags: {
    pharmacySearched: boolean
    childTreated: boolean
    zhaoControlTriggered: boolean
  }
}

export interface PublicAiConfig {
  configured: boolean
  provider: 'openai' | 'anthropic' | 'fallback'
}

export interface DemoStateResponse {
  state: DemoState
  availableActions: DemoAction[]
  ai: PublicAiConfig
}

export interface DemoTurnResponse extends DemoStateResponse {
  events: DemoEvent[]
  narrative: string
  majorEvent: boolean
}

interface DemoApiClientOptions {
  baseUrl: string
  fetcher?: typeof fetch
}

export function createDemoApiClient(options: DemoApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '')
  const fetcher = options.fetcher ?? fetch

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetcher(`${baseUrl}${path}`, init)

    if (!response.ok) {
      throw new Error(`Demo API request failed: ${response.status}`)
    }

    return (await response.json()) as T
  }

  return {
    getState() {
      return request<DemoStateResponse>('/demo/state')
    },

    reset() {
      return request<DemoStateResponse>('/demo/reset', {
        method: 'POST',
      })
    },

    resolveTurn(actionId: DemoActionId) {
      return request<DemoTurnResponse>('/demo/turn', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ actionId }),
      })
    },
  }
}

export const demoApi = createDemoApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8787',
})
