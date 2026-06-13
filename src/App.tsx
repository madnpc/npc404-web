import { Activity, Cross, RotateCcw, Search, Shield, Siren, Stethoscope, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import clinicScene from './assets/clinic-scene.svg'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { demoApi, type DemoAction, type DemoState, type DemoTurnResponse, type PublicAiConfig } from './lib/demo-api'

interface NarrativeEntry {
  id: string
  turn: number
  text: string
  major: boolean
}

interface GameViewState {
  state: DemoState
  actions: DemoAction[]
  ai: PublicAiConfig
}

const initialNarrative =
  '第 7 天，废弃社区诊所的日光灯只剩一半还能亮。林医生守着药柜，赵队长守着门，那个发烧的孩子在帘子后面断断续续地咳。'

export function App() {
  const [game, setGame] = useState<GameViewState | null>(null)
  const [narratives, setNarratives] = useState<NarrativeEntry[]>([])
  const [events, setEvents] = useState<DemoTurnResponse['events']>([])
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadState()
  }, [])

  const latestNarrative = narratives.at(-1)?.text ?? initialNarrative
  const linDoctor = game?.state.npcs['lin-doctor']
  const captainZhao = game?.state.npcs['captain-zhao']

  const eventTone = useMemo(() => {
    const lastType = events.at(-1)?.type
    if (lastType === 'NPC_ABNORMALITY_TRIGGERED') return 'danger'
    if (lastType === 'DANGER_EVENT_OCCURRED') return 'warning'
    return 'secondary'
  }, [events])

  async function loadState() {
    try {
      const response = await demoApi.getState()
      setGame({
        state: response.state,
        actions: response.availableActions,
        ai: response.ai,
      })
      setNarratives([{ id: 'intro', turn: response.state.turn, text: initialNarrative, major: false }])
      setError(null)
    } catch {
      setError('无法连接 npc404 服务')
    }
  }

  async function resolveTurn(action: DemoAction) {
    setSelectedAction(action.id)
    setIsResolving(true)
    setError(null)

    try {
      const response = await demoApi.resolveTurn(action.id)
      setGame({
        state: response.state,
        actions: response.availableActions,
        ai: response.ai,
      })
      setEvents((current) => [...response.events, ...current].slice(0, 8))
      setNarratives((current) => [
        ...current,
        {
          id: `${response.state.turn}-${action.id}`,
          turn: response.state.turn,
          text: response.narrative,
          major: response.majorEvent,
        },
      ])

      if (response.majorEvent) {
        setIsShaking(true)
        window.setTimeout(() => setIsShaking(false), 620)
      }
    } catch {
      setError('本回合没有结算成功')
    } finally {
      setIsResolving(false)
      window.setTimeout(() => setSelectedAction(null), 260)
    }
  }

  async function resetDemo() {
    setIsResolving(true)
    try {
      const response = await demoApi.reset()
      setGame({
        state: response.state,
        actions: response.availableActions,
        ai: response.ai,
      })
      setEvents([])
      setNarratives([{ id: 'intro-reset', turn: response.state.turn, text: initialNarrative, major: false }])
      setError(null)
    } catch {
      setError('重置失败')
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <main className={isShaking ? 'screen-shake min-h-screen bg-background text-foreground' : 'min-h-screen bg-background text-foreground'}>
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        <aside className="flex flex-col gap-4">
          <section className="overflow-hidden rounded-md border border-border bg-card">
            <img src={clinicScene} alt="废弃社区诊所示意图" className="h-36 w-full object-cover" />
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-lg font-semibold tracking-normal">末日NPC都不太正常</h1>
                  <p className="mt-1 text-sm text-muted-foreground">废弃社区诊所 · 第 {game?.state.day ?? 7} 天</p>
                </div>
                <Badge variant={game?.ai.configured ? 'success' : 'warning'}>{game?.ai.provider ?? 'fallback'}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={resetDemo} disabled={isResolving} className="w-full">
                <RotateCcw className="h-4 w-4" />
                重置诊所
              </Button>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>物资</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              <Metric label="食物" value={game?.state.resources.food ?? 0} />
              <Metric label="水" value={game?.state.resources.water ?? 0} />
              <Metric label="药品" value={game?.state.resources.medicine ?? 0} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>避难所</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">安全度</span>
                <Badge variant={safetyVariant(game?.state.shelter.safety ?? 0)}>{game?.state.shelter.safety ?? 0}/10</Badge>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, ((game?.state.shelter.safety ?? 0) / 10) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="flex min-h-[680px] flex-col rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">TURN {game?.state.turn ?? 1}</p>
              <h2 className="text-base font-semibold tracking-normal">{game?.state.location ?? '废弃社区诊所'}</h2>
            </div>
            <Badge variant={eventTone}>{events[0]?.type ?? 'WAITING'}</Badge>
          </div>

          <div className="flex flex-1 flex-col justify-between gap-4 p-4">
            <article key={latestNarrative} className="narrative-enter min-h-64 rounded-md border border-border bg-background/70 p-5">
              <p className="max-w-3xl whitespace-pre-line text-base leading-8 text-foreground">{latestNarrative}</p>
              {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
            </article>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(game?.actions ?? []).map((action) => (
                <Button
                  key={action.id}
                  variant={selectedAction === action.id ? 'secondary' : 'outline'}
                  size="lg"
                  disabled={isResolving}
                  onClick={() => void resolveTurn(action)}
                  className={
                    selectedAction === action.id
                      ? 'option-swap h-auto justify-start whitespace-normal text-left'
                      : 'h-auto justify-start whitespace-normal text-left'
                  }
                >
                  <ActionIcon tone={action.tone} />
                  <span className="flex min-w-0 flex-col items-start gap-1">
                    <span>{action.label}</span>
                    <span className="text-xs font-normal text-muted-foreground">{action.description}</span>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>NPC 状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {linDoctor ? <NpcRow npc={linDoctor} icon={<Stethoscope className="h-4 w-4" />} /> : null}
              {captainZhao ? <NpcRow npc={captainZhao} icon={<Shield className="h-4 w-4" />} /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>事件流</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">诊所还在屏息。</p>
              ) : (
                events.map((event) => (
                  <div key={event.id ?? `${event.type}-${event.description}`} className="rounded-sm border border-border bg-background/60 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{event.type}</span>
                      <Badge variant={event.type === 'NPC_ABNORMALITY_TRIGGERED' ? 'danger' : 'outline'}>{event.turn}</Badge>
                    </div>
                    <p className="text-sm leading-6">{event.description}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border bg-background/60 p-3 text-center">
      <div className="font-mono text-xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function NpcRow({ npc, icon }: { npc: DemoState['npcs']['lin-doctor']; icon: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{npc.name}</p>
            <p className="truncate text-xs text-muted-foreground">{npc.role}</p>
          </div>
        </div>
        <Badge variant={npc.abnormalityStage === 'unstable' ? 'danger' : npc.abnormalityStage === 'tense' ? 'warning' : 'outline'}>
          {npc.abnormalityStage}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <span className="rounded-sm bg-muted px-2 py-1">信任 {npc.trust}</span>
        <span className="rounded-sm bg-muted px-2 py-1">压力 {npc.pressure}</span>
      </div>
    </div>
  )
}

function ActionIcon({ tone }: { tone: DemoAction['tone'] }) {
  if (tone === 'talk') return <UserRound className="h-4 w-4 shrink-0" />
  if (tone === 'search') return <Search className="h-4 w-4 shrink-0" />
  if (tone === 'aid') return <Cross className="h-4 w-4 shrink-0" />
  return <Siren className="h-4 w-4 shrink-0" />
}

function safetyVariant(value: number) {
  if (value <= 3) return 'danger'
  if (value <= 5) return 'warning'
  return 'success'
}
