/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { type ElementType, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Code2,
  Copy,
  FileImage,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  MessageSquareText,
  Play,
  Server,
  ShieldAlert,
  Terminal,
  Video,
} from 'lucide-react'
import { useStatus } from '@/hooks/use-status'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { PublicLayout } from '@/components/layout'

export const Route = createFileRoute('/docs/')({
  component: ApiDocs,
})

type EndpointDoc = {
  id: string
  title: string
  method: 'GET' | 'POST'
  path: string
  badge: string
  description: string
  billable?: string
  requestBody?: string
  multipart?: boolean
}

type RunResult = {
  status: number | string
  elapsedMs: number
  body: string
  imageUrl?: string
  mediaUrl?: string
}

const navItems = [
  { id: 'quickstart', label: '快速开始' },
  { id: 'models', label: '模型与端点' },
  { id: 'text', label: '文本与多模态' },
  { id: 'image', label: '图片生成与编辑' },
  { id: 'video', label: '视频生成' },
  { id: 'billing', label: '计费与错误' },
]

const endpointDocs: EndpointDoc[] = [
  {
    id: 'models',
    title: '获取模型列表',
    method: 'GET',
    path: '/v1/models',
    badge: 'Discovery',
    description:
      '返回当前 Key 可用的模型，以及每个模型支持的 supported_endpoint_types。',
  },
  {
    id: 'chat',
    title: '文本聊天',
    method: 'POST',
    path: '/v1/chat/completions',
    badge: 'Text',
    description:
      'OpenAI Chat Completions 兼容接口。适合 GPT、Gemini、Grok、Claude 兼容文本模型。',
    requestBody: JSON.stringify(
      {
        model: 'gpt-5.5',
        messages: [
          {
            role: 'user',
            content: '用一句话说明这个 API 文档支持哪些能力。',
          },
        ],
      },
      null,
      2
    ),
  },
  {
    id: 'json-schema',
    title: '结构化 JSON 输出',
    method: 'POST',
    path: '/v1/chat/completions',
    badge: 'JSON Schema',
    description:
      '对支持结构化输出的文本模型，可以使用 response_format 指定 JSON Schema。',
    requestBody: JSON.stringify(
      {
        model: 'gpt-5.5',
        messages: [
          {
            role: 'user',
            content: '返回一个适合测试 API 文档的任务对象。',
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'api_doc_task',
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['title', 'priority'],
              properties: {
                title: { type: 'string' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              },
            },
          },
        },
      },
      null,
      2
    ),
  },
  {
    id: 'image-gpt',
    title: 'GPT 图片生成',
    method: 'POST',
    path: '/v1/images/generations',
    badge: 'Image',
    description:
      '统一图片生成接口。当前图片响应会尽量统一为 b64_json，方便代码直接保存。',
    billable: '按图片计费',
    requestBody: JSON.stringify(
      {
        model: 'gpt-image-2',
        prompt: 'A clean product photo of a citrus soda can on a white table.',
        size: '1024x1024',
        n: 1,
        response_format: 'b64_json',
      },
      null,
      2
    ),
  },
  {
    id: 'image-gemini',
    title: 'Gemini 图片生成',
    method: 'POST',
    path: '/v1/images/generations',
    badge: 'Image',
    description:
      'Gemini 图片模型也归一到 OpenAI 图片端点。支持 aspect_ratio 与 image_size。',
    billable: '按图片/模型配置计费',
    requestBody: JSON.stringify(
      {
        model: 'gemini-3.1-flash-image-preview',
        prompt: 'A compact desk setup, editorial product photography.',
        aspect_ratio: '16:9',
        image_size: '1K',
        response_format: 'b64_json',
      },
      null,
      2
    ),
  },
  {
    id: 'image-grok',
    title: 'Grok 图片生成',
    method: 'POST',
    path: '/v1/images/generations',
    badge: 'Image',
    description:
      'Grok Imagine 图片模型使用同一图片端点。lite 不支持图片编辑，normal/pro 支持编辑。',
    billable: '按图片计费',
    requestBody: JSON.stringify(
      {
        model: 'grok-imagine-image',
        prompt: 'Cinematic ink wash mountain scene, high detail.',
        aspect_ratio: '16:9',
        response_format: 'b64_json',
      },
      null,
      2
    ),
  },
  {
    id: 'image-edit',
    title: '图片编辑',
    method: 'POST',
    path: '/v1/images/edits',
    badge: 'Multipart',
    description:
      '使用 multipart/form-data 上传 image。支持 gpt-image-2、Gemini 图片模型、grok-imagine-image/pro。',
    billable: '按图片计费',
    multipart: true,
    requestBody: JSON.stringify(
      {
        model: 'gemini-2.5-flash-image',
        prompt: '把上传图片改成白底产品图，保留主体结构。',
        size: '1024x1024',
        response_format: 'b64_json',
      },
      null,
      2
    ),
  },
  {
    id: 'video-grok',
    title: 'Grok 视频生成',
    method: 'POST',
    path: '/v1/videos',
    badge: 'Video',
    description:
      'Grok Imagine 视频端点。可使用 image_urls 传参考图；提示词中 @图1、@图2 会按顺序映射到参考图。',
    billable: '按秒计费',
    requestBody: JSON.stringify(
      {
        model: 'grok-imagine-video',
        prompt: '水墨风格，横屏，云海山崖，镜头缓慢推进。',
        duration: '6',
        resolution: '720p',
        aspect_ratio: '16:9',
        format: 'compact',
        image_urls: [],
      },
      null,
      2
    ),
  },
]

const endpointMap = new Map(endpointDocs.map((item) => [item.id, item]))

function ApiDocs() {
  const { status } = useStatus()
  const baseUrl = useMemo(() => {
    const source =
      (status as Record<string, unknown> | null)?.server_address ??
      (status as Record<string, unknown> | null)?.serverAddress ??
      (status?.data as Record<string, unknown> | undefined)?.server_address ??
      (status?.data as Record<string, unknown> | undefined)?.serverAddress
    if (typeof source === 'string' && source.trim()) {
      return source.replace(/\/$/, '')
    }
    if (typeof window !== 'undefined') return window.location.origin
    return 'https://fzw.ai'
  }, [status])

  return (
    <PublicLayout showMainContainer={false}>
      <main className='bg-background min-h-svh pt-16'>
        <DocsHero baseUrl={baseUrl} />

        <div className='mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 md:px-6 lg:grid-cols-[220px_minmax(0,1fr)_420px] lg:items-start lg:py-10'>
          <DocsSidebar />

          <article className='min-w-0 space-y-12'>
            <QuickStartSection baseUrl={baseUrl} />
            <ModelsSection />
            <TextSection />
            <ImageSection />
            <VideoSection />
            <BillingSection />
          </article>

          <TryItPanel baseUrl={baseUrl} />
        </div>
      </main>
    </PublicLayout>
  )
}

function DocsHero(props: { baseUrl: string }) {
  return (
    <section className='border-border/70 bg-muted/20 border-b'>
      <div className='mx-auto max-w-7xl px-4 py-12 md:px-6 lg:py-16'>
        <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end'>
          <div className='space-y-6'>
            <Badge
              variant='outline'
              className='border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
            >
              API Docs
            </Badge>
            <div className='space-y-4'>
              <h1 className='max-w-3xl text-4xl leading-tight font-semibold tracking-tight md:text-5xl'>
                柚子中转 API 文档
              </h1>
              <p className='text-muted-foreground max-w-2xl text-base leading-7 md:text-lg'>
                面向实际可用模型整理的接口说明。文本、图片、视频都按当前网关行为编写，
                右侧示例可以直接填入 Key 运行测试。
              </p>
            </div>
            <div className='flex flex-wrap gap-3'>
              <Button render={<a href='#quickstart' />}>
                开始调用
                <ArrowRight className='size-4' />
              </Button>
              <Button variant='outline' render={<Link to='/pricing' />}>
                查看模型广场
              </Button>
            </div>
          </div>

          <div className='border-border/70 bg-background/80 overflow-hidden rounded-xl border shadow-sm'>
            <div className='border-border/70 flex items-center gap-2 border-b px-4 py-3'>
              <Terminal className='text-emerald-600 size-4' />
              <span className='text-sm font-medium'>Base URL</span>
            </div>
            <div className='space-y-3 p-4'>
              <code className='bg-muted block rounded-lg px-3 py-2 font-mono text-sm break-all'>
                {props.baseUrl}
              </code>
              <p className='text-muted-foreground text-sm'>
                所有 OpenAI 兼容 SDK 推荐使用{' '}
                <code className='bg-muted rounded px-1 py-0.5'>/v1</code>{' '}
                作为 baseURL 后缀。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DocsSidebar() {
  return (
    <aside className='hidden lg:sticky lg:top-24 lg:block'>
      <div className='space-y-2'>
        <div className='text-muted-foreground px-2 text-xs font-semibold tracking-[0.14em] uppercase'>
          Contents
        </div>
        <nav className='space-y-1'>
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className='text-muted-foreground hover:bg-muted hover:text-foreground block rounded-lg px-2 py-2 text-sm transition-colors'
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}

function SectionTitle(props: {
  id: string
  icon: ElementType
  eyebrow: string
  title: string
  description: string
}) {
  const Icon = props.icon
  return (
    <header id={props.id} className='scroll-mt-24 space-y-3'>
      <div className='text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase'>
        <Icon className='size-4' />
        {props.eyebrow}
      </div>
      <div className='space-y-2'>
        <h2 className='text-2xl font-semibold tracking-tight md:text-3xl'>
          {props.title}
        </h2>
        <p className='text-muted-foreground max-w-3xl leading-7'>
          {props.description}
        </p>
      </div>
    </header>
  )
}

function QuickStartSection(props: { baseUrl: string }) {
  const curl = [
    `curl ${props.baseUrl}/v1/chat/completions \\`,
    `  -H "Authorization: Bearer $YOUR_API_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{`,
    `    "model": "gpt-5.5",`,
    `    "messages": [{"role": "user", "content": "hi"}]`,
    `  }'`,
  ].join('\n')

  return (
    <section className='space-y-5'>
      <SectionTitle
        id='quickstart'
        icon={BookOpen}
        eyebrow='Start'
        title='快速开始'
        description='创建令牌后，在 Authorization 头里传 Bearer Key。下面的示例可以直接在终端运行。'
      />
      <CodeBlock code={curl} language='bash'>
        <CodeBlockCopyButton />
      </CodeBlock>
      <InfoGrid
        items={[
          {
            icon: KeyRound,
            title: '鉴权',
            text: '所有接口使用 Authorization: Bearer sk-...。不要把 Key 写进前端公开代码。',
          },
          {
            icon: Server,
            title: '模型发现',
            text: '/v1/models 会返回当前 Key 可用模型，并标注 supported_endpoint_types。',
          },
          {
            icon: Code2,
            title: 'SDK 兼容',
            text: 'OpenAI Python / JS SDK 可以直接使用。图片和视频请使用对应的 /v1/images 或 /v1/videos 端点。',
          },
        ]}
      />
    </section>
  )
}

function ModelsSection() {
  return (
    <section className='space-y-5'>
      <SectionTitle
        id='models'
        icon={Server}
        eyebrow='Discovery'
        title='模型与 API 端点'
        description='模型广场与 /v1/models 返回的是当前网关实际支持的端点，不再展示底层上游的误导性接口。'
      />
      <EndpointTable
        rows={[
          ['openai', '/v1/chat/completions', '文本聊天兼容接口'],
          ['openai-response', '/v1/responses', 'Responses 兼容接口'],
          ['image-generation', '/v1/images/generations', '图片生成'],
          ['image-edit', '/v1/images/edits', '图片编辑，multipart 上传 image'],
          ['openai-video', '/v1/videos', '视频生成'],
          ['gemini', '/v1beta/models/{model}:generateContent', 'Gemini 原生文本接口'],
          ['anthropic', '/v1/messages', 'Claude 原生消息接口'],
        ]}
      />
      <p className='text-muted-foreground text-sm leading-6'>
        图片模型只会展示图片端点，视频模型只会展示视频端点。比如
        <code className='bg-muted mx-1 rounded px-1 py-0.5'>
          grok-imagine-video
        </code>
        只应使用
        <code className='bg-muted mx-1 rounded px-1 py-0.5'>/v1/videos</code>。
      </p>
    </section>
  )
}

function TextSection() {
  return (
    <section className='space-y-5'>
      <SectionTitle
        id='text'
        icon={MessageSquareText}
        eyebrow='Text'
        title='文本、结构化输出与多模态理解'
        description='文本模型优先使用 /v1/chat/completions。支持 JSON Schema 的模型可以使用 response_format 约束输出。'
      />
      <InfoGrid
        items={[
          {
            icon: CheckCircle2,
            title: '普通文本',
            text: 'gpt-5.5、Gemini 文本、Grok 文本等都可通过 chat/completions 调用。',
          },
          {
            icon: CheckCircle2,
            title: 'JSON Schema',
            text: '对支持结构化输出的模型，使用 response_format.type = json_schema。',
          },
          {
            icon: ShieldAlert,
            title: '多模态输入',
            text: '图片、音频、视频、PDF 是否可用取决于具体模型与当前渠道。建议先用小文件测试。',
          },
        ]}
      />
    </section>
  )
}

function ImageSection() {
  return (
    <section className='space-y-5'>
      <SectionTitle
        id='image'
        icon={ImageIcon}
        eyebrow='Images'
        title='图片生成与图片编辑'
        description='GPT、Gemini、Grok 图片模型都归一到 OpenAI 图片端点，响应优先返回 b64_json，方便代码直接保存。'
      />
      <EndpointTable
        rows={[
          ['gpt-image-2', '/v1/images/generations, /v1/images/edits', '支持生成和编辑'],
          [
            'gemini-2.5-flash-image',
            '/v1/images/generations, /v1/images/edits',
            '支持 OpenAI 图片端点封装',
          ],
          [
            'gemini-3.1-flash-image-preview',
            '/v1/images/generations, /v1/images/edits',
            '支持 aspect_ratio 与 image_size',
          ],
          [
            'grok-imagine-image-lite',
            '/v1/images/generations',
            'lite 只用于生成',
          ],
          [
            'grok-imagine-image / pro',
            '/v1/images/generations, /v1/images/edits',
            'normal/pro 支持编辑',
          ],
        ]}
      />
      <div className='border-border/70 bg-muted/20 rounded-xl border p-4'>
        <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
          <FileImage className='size-4 text-emerald-600' />
          Gemini 图片参数
        </div>
        <p className='text-muted-foreground text-sm leading-6'>
          推荐使用
          <code className='bg-background mx-1 rounded px-1 py-0.5'>
            aspect_ratio
          </code>
          和
          <code className='bg-background mx-1 rounded px-1 py-0.5'>
            image_size
          </code>
          ：例如
          <code className='bg-background mx-1 rounded px-1 py-0.5'>1:1</code>
          、
          <code className='bg-background mx-1 rounded px-1 py-0.5'>16:9</code>
          、
          <code className='bg-background mx-1 rounded px-1 py-0.5'>1K</code>
          、
          <code className='bg-background mx-1 rounded px-1 py-0.5'>2K</code>
          、
          <code className='bg-background mx-1 rounded px-1 py-0.5'>4K</code>。
        </p>
      </div>
    </section>
  )
}

function VideoSection() {
  return (
    <section className='space-y-5'>
      <SectionTitle
        id='video'
        icon={Video}
        eyebrow='Video'
        title='Grok 视频生成'
        description='视频使用 /v1/videos。当前 Grok 视频会按秒计费，生成耗时通常几十秒到数分钟。'
      />
      <EndpointTable
        rows={[
          ['model', 'grok-imagine-video', '固定使用 Grok Imagine 视频模型'],
          ['duration', '6 或 8', '时长，按秒计费'],
          ['resolution', '720p', '当前建议使用 720p'],
          ['aspect_ratio', '16:9 / 9:16 / 1:1', '横屏、竖屏或方图'],
          ['image_urls', 'string[]', '参考图 URL 数组'],
          ['@图1', 'prompt 文本标记', '按 image_urls 顺序绑定参考图'],
        ]}
      />
      <div className='border-amber-500/30 bg-amber-500/10 rounded-xl border p-4 text-sm leading-6 text-amber-900 dark:text-amber-200'>
        <div className='mb-1 flex items-center gap-2 font-medium'>
          <AlertTriangle className='size-4' />
          参考图提示
        </div>
        写了 @图4 但只传 3 张参考图时，@图4 会被当作普通文本处理。为了提高遵照度，
        prompt 中建议明确写出每张参考图对应的角色或物体。
      </div>
    </section>
  )
}

function BillingSection() {
  return (
    <section className='space-y-5 pb-12'>
      <SectionTitle
        id='billing'
        icon={CircleDollarSign}
        eyebrow='Billing'
        title='计费、返回与常见错误'
        description='不同模型的计费单位不同。图片一般按张，Grok 视频按秒，文本按 token 或动态规则。'
      />
      <InfoGrid
        items={[
          {
            icon: CircleDollarSign,
            title: '按张计费',
            text: 'gpt-image-2、grok-imagine-image、grok-imagine-image-pro 等图片模型按图片计费。',
          },
          {
            icon: CircleDollarSign,
            title: '按秒计费',
            text: 'grok-imagine-video 按 duration 秒数计费。测试时建议先用 6 秒。',
          },
          {
            icon: AlertTriangle,
            title: '常见错误',
            text: '401 表示 Key 或账号无效；429 表示上游或账号限流；502/503 多为上游不可用或账号池耗尽。',
          },
        ]}
      />
    </section>
  )
}

function InfoGrid(props: {
  items: Array<{ icon: ElementType; title: string; text: string }>
}) {
  return (
    <div className='grid gap-3 md:grid-cols-3'>
      {props.items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.title}
            className='border-border/70 bg-background rounded-xl border p-4'
          >
            <Icon className='mb-3 size-5 text-emerald-600' />
            <div className='mb-1 text-sm font-semibold'>{item.title}</div>
            <p className='text-muted-foreground text-sm leading-6'>
              {item.text}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function EndpointTable(props: { rows: string[][] }) {
  return (
    <div className='border-border/70 overflow-hidden rounded-xl border'>
      <table className='w-full text-sm'>
        <tbody>
          {props.rows.map((row) => (
            <tr key={row.join('|')} className='border-border/60 border-b last:border-0'>
              <td className='bg-muted/30 w-[32%] px-4 py-3 align-top font-mono text-xs break-all'>
                {row[0]}
              </td>
              <td className='px-4 py-3 align-top font-mono text-xs break-all'>
                {row[1]}
              </td>
              <td className='text-muted-foreground px-4 py-3 align-top leading-6'>
                {row[2]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TryItPanel(props: { baseUrl: string }) {
  const [apiKey, setApiKey] = useState('')
  const [activeId, setActiveId] = useState('chat')
  const active = endpointMap.get(activeId) ?? endpointDocs[1]
  const [body, setBody] = useState(active.requestBody ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<RunResult | null>(null)

  const curl = useMemo(
    () => buildCurl(props.baseUrl, active, body),
    [props.baseUrl, active, body]
  )

  const selectEndpoint = (id: string) => {
    const next = endpointMap.get(id) ?? endpointDocs[0]
    setActiveId(id)
    setBody(next.requestBody ?? '')
    setResult(null)
  }

  const runRequest = async () => {
    setIsRunning(true)
    setResult(null)
    const startedAt = performance.now()
    try {
      if (!apiKey.trim()) {
        throw new Error('请先输入 API Key。')
      }
      if (active.multipart && !file) {
        throw new Error('图片编辑需要先选择 image 文件。')
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey.trim()}`,
      }
      let payload: BodyInit | undefined

      if (active.method === 'POST') {
        if (active.multipart) {
          const parsed = parseBody(body)
          const form = new FormData()
          for (const [key, value] of Object.entries(parsed)) {
            form.append(
              key,
              typeof value === 'string' ? value : JSON.stringify(value)
            )
          }
          if (file) form.append('image', file)
          payload = form
        } else {
          headers['Content-Type'] = 'application/json'
          payload = body
        }
      }

      const response = await fetch(`${props.baseUrl}${active.path}`, {
        method: active.method,
        headers,
        body: payload,
      })
      const text = await response.text()
      setResult({
        status: response.status,
        elapsedMs: Math.round(performance.now() - startedAt),
        body: prettyBody(text),
        ...extractPreview(text),
      })
    } catch (error) {
      setResult({
        status: 'client_error',
        elapsedMs: Math.round(performance.now() - startedAt),
        body: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <aside className='lg:sticky lg:top-24'>
      <div className='border-border/70 bg-background overflow-hidden rounded-xl border shadow-sm'>
        <div className='border-border/70 border-b p-4'>
          <div className='mb-2 flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2 font-semibold'>
              <Play className='size-4 text-emerald-600' />
              Run request
            </div>
            <Badge variant='outline'>{active.badge}</Badge>
          </div>
          <p className='text-muted-foreground text-sm leading-6'>
            {active.description}
          </p>
        </div>

        <div className='space-y-4 p-4'>
          <div className='grid grid-cols-2 gap-2'>
            {endpointDocs.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => selectEndpoint(item.id)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                  active.id === item.id
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                    : 'border-border/70 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                )}
              >
                {item.title}
              </button>
            ))}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>API Key</label>
            <Input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder='sk-...'
              type='password'
              autoComplete='off'
            />
            <p className='text-muted-foreground text-xs'>
              Key 只保存在当前浏览器内存，不会写入页面代码示例。
            </p>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              <label className='text-sm font-medium'>Request</label>
              <span className='text-muted-foreground font-mono text-xs'>
                {active.method} {active.path}
              </span>
            </div>
            {active.method === 'POST' ? (
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className='min-h-48 font-mono text-xs'
              />
            ) : (
              <div className='bg-muted rounded-lg px-3 py-2 font-mono text-xs'>
                No request body
              </div>
            )}
          </div>

          {active.multipart && (
            <div className='space-y-2'>
              <label className='text-sm font-medium'>image file</label>
              <Input
                type='file'
                accept='image/png,image/jpeg,image/webp'
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {active.billable && (
            <div className='border-amber-500/30 bg-amber-500/10 rounded-lg border px-3 py-2 text-xs text-amber-900 dark:text-amber-200'>
              {active.billable}
            </div>
          )}

          <Button
            className='w-full'
            onClick={runRequest}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Play className='size-4' />
            )}
            Run
          </Button>

          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm font-medium'>
              <Copy className='size-4' />
              cURL
            </div>
            <CodeBlock code={curl} language='bash' className='max-h-80'>
              <CodeBlockCopyButton />
            </CodeBlock>
          </div>

          {result && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-2 text-sm font-medium'>
                <span>Response</span>
                <span className='text-muted-foreground font-mono text-xs'>
                  {result.status} · {result.elapsedMs}ms
                </span>
              </div>
              {result.imageUrl && (
                <img
                  src={result.imageUrl}
                  alt='Generated result'
                  className='border-border max-h-56 w-full rounded-lg border object-contain'
                />
              )}
              {result.mediaUrl && (
                <a
                  href={result.mediaUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-emerald-700 hover:underline dark:text-emerald-300'
                >
                  打开媒体地址
                </a>
              )}
              <pre className='bg-muted max-h-72 overflow-auto rounded-lg p-3 text-xs whitespace-pre-wrap'>
                {result.body}
              </pre>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function parseBody(body: string): Record<string, unknown> {
  const parsed = JSON.parse(body)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Request body must be a JSON object.')
  }
  return parsed as Record<string, unknown>
}

function buildCurl(baseUrl: string, endpoint: EndpointDoc, body: string) {
  const url = `${baseUrl}${endpoint.path}`
  if (endpoint.method === 'GET') {
    return [
      `curl ${url} \\`,
      `  -H "Authorization: Bearer $YOUR_API_KEY"`,
    ].join('\n')
  }
  if (endpoint.multipart) {
    let parsed: Record<string, unknown> = {}
    try {
      parsed = parseBody(body)
    } catch {
      parsed = {}
    }
    const lines = [
      `curl ${url} \\`,
      `  -H "Authorization: Bearer $YOUR_API_KEY" \\`,
    ]
    for (const [key, value] of Object.entries(parsed)) {
      lines.push(
        `  -F "${key}=${typeof value === 'string' ? value : JSON.stringify(value)}" \\`
      )
    }
    lines.push(`  -F "image=@input.png"`)
    return lines.join('\n')
  }
  return [
    `curl ${url} \\`,
    `  -H "Authorization: Bearer $YOUR_API_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${body.replace(/\n/g, '\n     ')}'`,
  ].join('\n')
}

function prettyBody(text: string) {
  try {
    const json = JSON.parse(text)
    return JSON.stringify(redactLargeFields(json), null, 2)
  } catch {
    return text
  }
}

function redactLargeFields(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.length > 1200 ? `${value.slice(0, 1200)}... [truncated]` : value
  }
  if (Array.isArray(value)) return value.map(redactLargeFields)
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      next[key] = redactLargeFields(item)
    }
    return next
  }
  return value
}

function extractPreview(text: string): Pick<RunResult, 'imageUrl' | 'mediaUrl'> {
  try {
    const json = JSON.parse(text)
    const first = json?.data?.[0] ?? json?.output?.[0] ?? json
    const b64 = first?.b64_json ?? first?.image_b64 ?? first?.image
    if (typeof b64 === 'string' && b64.length > 100) {
      const mime = b64.startsWith('/9j/') ? 'image/jpeg' : 'image/png'
      return { imageUrl: `data:${mime};base64,${b64}` }
    }
    const url =
      first?.url ??
      first?.public_url ??
      first?.video_url ??
      json?.url ??
      json?.public_url
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      return { mediaUrl: url }
    }
  } catch {
    /* empty */
  }
  return {}
}
