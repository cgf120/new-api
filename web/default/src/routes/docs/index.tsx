/*
Copyright (C) 2025 QuantumNous

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
// @ts-nocheck

import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Code2,
  Copy as IconCopy,
  FileImage,
  Image,
  KeyRound,
  MessageSquareText,
  Play as IconPlay,
  Server,
  Video,
} from 'lucide-react';
import { useStatus } from '@/hooks/use-status';
import { PublicLayout } from '@/components/layout';

export const Route = createFileRoute('/docs/')({
  component: Docs,
});

function Title({ heading = 3, className = '', children }) {
  const TagName = `h${heading}`;
  return <TagName className={className}>{children}</TagName>;
}

function Text({ type, strong, size, code, className = '', children }) {
  const classes = [
    type === 'secondary' ? 'docs-text-secondary' : '',
    type === 'tertiary' ? 'docs-text-tertiary' : '',
    strong ? 'docs-text-strong' : '',
    size === 'small' ? 'docs-text-small' : '',
    code ? 'docs-text-code' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <span className={classes}>{children}</span>;
}

function Divider({ margin = '16px' }) {
  return <div className='docs-divider' style={{ margin }} />;
}

function Button({ icon, loading, children, onClick, style, size }) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={loading}
      style={style}
      className={`docs-button ${size === 'small' ? 'small' : ''}`}
    >
      {loading ? <span className='docs-spinner' /> : icon}
      <span>{children}</span>
    </button>
  );
}

function Input({ value, onChange, placeholder, mode, autoComplete, style }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      type={mode === 'password' ? 'password' : 'text'}
      autoComplete={autoComplete}
      style={style}
      className='docs-input'
    />
  );
}

function TextArea({ value, onChange, autosize, className = '' }) {
  const minRows = autosize?.minRows ?? 8;
  const maxRows = autosize?.maxRows ?? 14;
  return (
    <textarea
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      rows={minRows}
      className={`docs-textarea ${className}`}
      style={{ maxHeight: `${maxRows * 1.7}em` }}
    />
  );
}

function Select({ value, onChange, optionList, style }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      style={style}
      className='docs-select'
    >
      {optionList.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Tag({ color, children }) {
  return <span className={`docs-tag ${color ? `docs-tag-${color}` : ''}`}>{children}</span>;
}

const docs = [
  {
    id: 'introduction',
    group: '开始',
    label: 'API 介绍',
    title: 'API 参考',
    eyebrow: 'Introduction',
    icon: BookOpen,
    description:
      '柚子中转提供 OpenAI 兼容接口，并将 GPT、Gemini、Grok 等图片和视频能力统一到稳定的 API 入口。',
    type: 'guide',
  },
  {
    id: 'models',
    group: '模型',
    label: '获取模型列表',
    title: '获取模型列表',
    eyebrow: 'Model Discovery',
    icon: Server,
    method: 'GET',
    path: '/v1/models',
    description:
      '返回当前令牌可用的模型列表，并通过 supported_endpoint_types 标明每个模型支持的 API 端点。',
    params: [],
    responseExample: {
      object: 'list',
      data: [
        {
          id: 'gpt-5.5',
          object: 'model',
          supported_endpoint_types: ['openai', 'openai-response'],
        },
        {
          id: 'grok-imagine-video',
          object: 'model',
          supported_endpoint_types: ['openai-video'],
        },
      ],
    },
    notes: ['建议客户端启动时缓存模型列表，用于判断模型应走哪个端点。'],
  },
  {
    id: 'chat',
    group: '文本',
    label: '文本聊天',
    title: '文本聊天',
    eyebrow: 'Chat Completions',
    icon: MessageSquareText,
    method: 'POST',
    path: '/v1/chat/completions',
    description:
      'OpenAI Chat Completions 兼容接口。适合 GPT、Gemini、Grok、Claude 等文本模型。',
    params: [
      ['model', 'string', '是', '模型名称，例如 gpt-5.5、gemini-3-flash-preview、grok-4.20-fast。'],
      ['messages', 'array', '是', 'OpenAI messages 数组。'],
      ['stream', 'boolean', '否', '是否使用流式输出。'],
    ],
    requestBody: {
      model: 'gpt-5.5',
      messages: [
        {
          role: 'user',
          content: '用一句话说明这个 API 文档支持哪些能力。',
        },
      ],
    },
    responseExample: {
      id: 'chatcmpl_xxx',
      object: 'chat.completion',
      choices: [
        {
          message: {
            role: 'assistant',
            content: '该文档覆盖文本、图片、视频模型的统一调用方式。',
          },
        },
      ],
    },
  },
  {
    id: 'json-schema',
    group: '文本',
    label: '结构化输出',
    title: '结构化 JSON 输出',
    eyebrow: 'JSON Schema',
    icon: Code2,
    method: 'POST',
    path: '/v1/chat/completions',
    description:
      '对支持结构化输出的模型，可以使用 response_format.type = json_schema 约束返回 JSON。',
    params: [
      ['response_format.type', 'string', '是', '固定为 json_schema。'],
      ['response_format.json_schema.schema', 'object', '是', '标准 JSON Schema。'],
    ],
    requestBody: {
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
    responseExample: {
      title: '验证 API 文档在线调试',
      priority: 'medium',
    },
  },
  {
    id: 'image-generation',
    group: '图片',
    label: '图片生成',
    title: '图片生成',
    eyebrow: 'Images',
    icon: Image,
    method: 'POST',
    path: '/v1/images/generations',
    description:
      '统一图片生成接口。GPT、Gemini、Grok 图片模型都可以通过该端点调用，响应优先返回 b64_json。',
    params: [
      ['model', 'string', '是', '例如 gpt-image-2、gemini-3.1-flash-image-preview、grok-imagine-image。'],
      ['prompt', 'string', '是', '图片提示词。'],
      ['size', 'string', '否', 'OpenAI 风格尺寸，例如 1024x1024。'],
      ['aspect_ratio', 'string', '否', 'Gemini/Grok 常用比例，例如 1:1、16:9、9:16。'],
      ['image_size', 'string', '否', 'Gemini 图片尺寸，例如 1K、2K、4K。'],
    ],
    requestBody: {
      model: 'gpt-image-2',
      prompt: 'A clean product photo of a citrus soda can on a white table.',
      size: '1024x1024',
      n: 1,
      response_format: 'b64_json',
    },
    responseExample: {
      created: 1710000000,
      data: [{ b64_json: '<base64 image>' }],
    },
    notes: [
      'grok-imagine-image-lite 只建议用于生成。',
      'Gemini 图片建议优先传 aspect_ratio 与 image_size。',
    ],
    billable: '按图片计费',
  },
  {
    id: 'image-edit',
    group: '图片',
    label: '图片编辑',
    title: '图片编辑',
    eyebrow: 'Image Edits',
    icon: FileImage,
    method: 'POST',
    path: '/v1/images/edits',
    description:
      '使用 multipart/form-data 上传 image 文件。支持 gpt-image-2、Gemini 图片模型、grok-imagine-image/pro。',
    multipart: true,
    params: [
      ['image', 'file', '是', '上传的 PNG、JPG 或 WebP 图片。'],
      ['model', 'string', '是', '图片编辑模型。'],
      ['prompt', 'string', '是', '编辑指令。'],
      ['size', 'string', '否', '目标尺寸。'],
    ],
    requestBody: {
      model: 'gemini-2.5-flash-image',
      prompt: '把上传图片改成白底产品图，保留主体结构。',
      size: '1024x1024',
      response_format: 'b64_json',
    },
    responseExample: {
      created: 1710000000,
      data: [{ b64_json: '<base64 edited image>' }],
    },
    notes: ['grok-imagine-image-lite 不支持图片编辑，Grok 编辑请使用 normal/pro。'],
    billable: '按图片计费',
  },
  {
    id: 'video-grok',
    group: '视频',
    label: 'Grok 视频生成',
    title: 'Grok 视频生成',
    eyebrow: 'Videos',
    icon: Video,
    method: 'POST',
    path: '/v1/videos',
    description:
      'Grok Imagine 视频端点。支持纯文本生成，也可以用 image_urls 传参考图。',
    params: [
      ['model', 'string', '是', '固定为 grok-imagine-video。'],
      ['prompt', 'string', '是', '视频提示词。@图1、@图2 会按 image_urls 顺序绑定参考图。'],
      ['duration', 'string', '否', '建议 6 或 8，按秒计费。'],
      ['resolution', 'string', '否', '当前建议 720p。'],
      ['aspect_ratio', 'string', '否', '16:9、9:16、1:1。'],
      ['image_urls', 'array', '否', '参考图 URL 数组。'],
    ],
    requestBody: {
      model: 'grok-imagine-video',
      prompt: '水墨风格，横屏，云海山崖，镜头缓慢推进。',
      duration: '6',
      resolution: '720p',
      aspect_ratio: '16:9',
      format: 'compact',
      image_urls: [],
    },
    responseExample: {
      id: 'video_xxx',
      status: 'succeeded',
      url: 'https://imagine-public.x.ai/imagine-public/share-videos/example.mp4?dl=0',
    },
    notes: [
      '写了 @图4 但只传 3 张参考图时，@图4 会被当作普通文本处理。',
      '视频生成耗时通常几十秒到数分钟。',
    ],
    billable: '按秒计费',
  },
  {
    id: 'errors',
    group: '计费',
    label: '计费与错误',
    title: '计费与错误',
    eyebrow: 'Billing',
    icon: AlertCircle,
    description:
      '不同模型的计费单位不同。图片一般按张，Grok 视频按秒，文本按 token 或动态规则。',
    type: 'guide',
  },
];

const groupedDocs = docs.reduce((acc, item) => {
  if (!acc[item.group]) acc[item.group] = [];
  acc[item.group].push(item);
  return acc;
}, {});

const codeLanguages = [
  { label: 'cURL', value: 'curl' },
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
];

function Docs() {
  const { status } = useStatus();
  const [activeId, setActiveId] = useState(() => getInitialDocId());
  const activeDoc = docs.find((item) => item.id === activeId) || docs[0];
  const baseUrl = useMemo(() => {
    const configured =
      status?.server_address ??
      status?.serverAddress ??
      status?.data?.server_address ??
      status?.data?.serverAddress;
    if (configured && typeof configured === 'string') {
      return configured.replace(/\/$/, '');
    }
    if (typeof window === 'undefined') {
      return 'https://fzw.ai';
    }
    return window.location.origin;
  }, [status]);

  useEffect(() => {
    const onHashChange = () => {
      const next = getInitialDocId();
      setActiveId(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const onSelectDoc = (id) => {
    setActiveId(id);
    window.history.replaceState(null, '', `/docs#${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PublicLayout showMainContainer={false}>
      <div className='classic-page-fill docs-page-root'>
        <div className='docs-layout'>
          <DocsSidebar activeId={activeDoc.id} onSelectDoc={onSelectDoc} />
          <DocContent doc={activeDoc} baseUrl={baseUrl} />
          <RightRail doc={activeDoc} baseUrl={baseUrl} />
        </div>
        <DocsStyles />
      </div>
    </PublicLayout>
  );
}

function DocsSidebar({ activeId, onSelectDoc }) {
  return (
    <aside className='docs-sidebar'>
      <a href='/' className='docs-brand'>
        <span className='docs-brand-mark'>Y</span>
        <span>柚子中转</span>
      </a>
      <div className='docs-search'>搜索文档 ⌘K</div>
      <nav className='docs-nav'>
        {Object.entries(groupedDocs).map(([group, items]) => (
          <div key={group} className='docs-nav-group'>
            <div className='docs-nav-title'>{group}</div>
            {items.map((item) => {
              const Icon = item.icon || BookOpen;
              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => onSelectDoc(item.id)}
                  className={`docs-nav-item ${activeId === item.id ? 'active' : ''}`}
                >
                  {item.method && (
                    <span className={`method method-${item.method.toLowerCase()}`}>
                      {item.method}
                    </span>
                  )}
                  {!item.method && <Icon size={14} />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function DocContent({ doc, baseUrl }) {
  if (doc.id === 'introduction') {
    return <IntroductionContent baseUrl={baseUrl} />;
  }
  if (doc.id === 'errors') {
    return <ErrorsContent />;
  }

  const Icon = doc.icon || BookOpen;
  return (
    <main className='docs-content'>
      <div className='docs-eyebrow'>
        <Icon size={16} />
        {doc.eyebrow}
      </div>
      <Title heading={1} className='docs-page-title'>
        {doc.title}
      </Title>
      <Text type='secondary' className='docs-lead'>
        {doc.description}
      </Text>

      <div className='endpoint-line'>
        <span className={`method method-${doc.method.toLowerCase()}`}>{doc.method}</span>
        <code>{doc.path}</code>
      </div>

      <DocSection title='请求参数'>
        {doc.params?.length ? (
          <ParameterTable rows={doc.params} />
        ) : (
          <Text type='secondary'>此接口不需要请求参数。</Text>
        )}
      </DocSection>

      <DocSection title='响应示例'>
        <CodeBlock code={JSON.stringify(doc.responseExample || {}, null, 2)} />
      </DocSection>

      {doc.notes?.length > 0 && (
        <DocSection title='注意事项'>
          <ul className='docs-list'>
            {doc.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </DocSection>
      )}
    </main>
  );
}

function IntroductionContent({ baseUrl }) {
  return (
    <main className='docs-content'>
      <div className='docs-eyebrow'>
        <BookOpen size={16} />
        Introduction
      </div>
      <Title heading={1} className='docs-page-title'>
        API 参考
      </Title>
      <Text type='secondary' className='docs-lead'>
        柚子中转开放接口文档。这里按实际可用端点组织：文本走 Chat Completions，图片走 Images，视频走 Videos。
      </Text>

      <DocSection title='基础信息'>
        <InfoRows
          rows={[
            ['API 基础 URL', baseUrl],
            ['认证方式', 'Authorization: Bearer YOUR_API_KEY'],
            ['请求格式', 'application/json；图片编辑使用 multipart/form-data'],
            ['响应格式', 'OpenAI 兼容 JSON，图片优先返回 b64_json'],
          ]}
        />
      </DocSection>

      <DocSection title='API 概览'>
        <div className='overview-grid'>
          <OverviewCard title='文本模型' text='/v1/chat/completions；支持普通文本、部分模型支持 JSON Schema 和多模态理解。' />
          <OverviewCard title='图片模型' text='/v1/images/generations 与 /v1/images/edits；覆盖 GPT、Gemini、Grok 图片。' />
          <OverviewCard title='视频模型' text='/v1/videos；当前主要用于 Grok Imagine 视频，按秒计费。' />
        </div>
      </DocSection>

      <DocSection title='快速开始'>
        <CodeBlock
          code={[
            `curl ${baseUrl}/v1/chat/completions \\`,
            `  -H "Authorization: Bearer $YOUR_API_KEY" \\`,
            `  -H "Content-Type: application/json" \\`,
            `  -d '{`,
            `    "model": "gpt-5.5",`,
            `    "messages": [{"role": "user", "content": "hi"}]`,
            `  }'`,
          ].join('\n')}
        />
      </DocSection>
    </main>
  );
}

function ErrorsContent() {
  return (
    <main className='docs-content'>
      <div className='docs-eyebrow'>
        <AlertCircle size={16} />
        Billing
      </div>
      <Title heading={1} className='docs-page-title'>
        计费与错误
      </Title>
      <Text type='secondary' className='docs-lead'>
        文本、图片、视频模型的计费单位不同。调用前建议先在模型广场确认单价和可用端点。
      </Text>

      <DocSection title='计费单位'>
        <ParameterTable
          rows={[
            ['文本模型', 'token / 动态规则', '按模型配置扣费。'],
            ['图片模型', '按张', 'gpt-image-2、grok-imagine-image/pro 等图片模型按图片数计费。'],
            ['视频模型', '按秒', 'grok-imagine-video 按 duration 秒数计费。'],
          ]}
          headers={['类型', '单位', '说明']}
        />
      </DocSection>

      <DocSection title='常见错误'>
        <ParameterTable
          rows={[
            ['400', 'invalid_request_error', '模型与端点不匹配，或请求参数格式错误。'],
            ['401', 'invalid credentials', 'Key 无效或上游账号失效。'],
            ['429', 'rate limit', '上游账号或渠道限流。'],
            ['502 / 503', 'upstream_error', '上游不可用、账号池耗尽或网络异常。'],
          ]}
          headers={['HTTP', '类型', '说明']}
        />
      </DocSection>
    </main>
  );
}

function RightRail({ doc, baseUrl }) {
  if (doc.type === 'guide') {
    return (
      <aside className='docs-right'>
        <GuideCard baseUrl={baseUrl} />
      </aside>
    );
  }
  return (
    <aside className='docs-right'>
      <CodeAndTry doc={doc} baseUrl={baseUrl} />
    </aside>
  );
}

function GuideCard({ baseUrl }) {
  return (
    <div className='right-card'>
      <div className='right-card-title'>
        <KeyRound size={16} />
        Authentication
      </div>
      <Text type='secondary' className='right-text'>
        所有接口都使用 Bearer Token。不要在浏览器公开代码里硬编码 API Key。
      </Text>
      <CodeBlock
        compact
        code={[
          `base_url = "${baseUrl}/v1"`,
          `headers = {`,
          `  "Authorization": "Bearer $YOUR_API_KEY"`,
          `}`,
        ].join('\n')}
      />
      <Divider margin='16px' />
      <div className='right-card-title'>
        <CheckCircle2 size={16} />
        Endpoint Rules
      </div>
      <ul className='right-list'>
        <li>文本模型使用 /v1/chat/completions</li>
        <li>图片生成使用 /v1/images/generations</li>
        <li>图片编辑使用 /v1/images/edits</li>
        <li>视频生成使用 /v1/videos</li>
      </ul>
    </div>
  );
}

function CodeAndTry({ doc, baseUrl }) {
  const [language, setLanguage] = useState('curl');
  const [apiKey, setApiKey] = useState('');
  const [body, setBody] = useState(JSON.stringify(doc.requestBody || {}, null, 2));
  const [file, setFile] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setBody(JSON.stringify(doc.requestBody || {}, null, 2));
    setResult(null);
    setFile(null);
  }, [doc.id]);

  const code = useMemo(
    () => buildCodeExample(baseUrl, doc, body, language),
    [baseUrl, doc, body, language],
  );

  const runRequest = async () => {
    setIsRunning(true);
    setResult(null);
    const startedAt = performance.now();
    try {
      if (!apiKey.trim()) {
        throw new Error('请先输入 API Key。');
      }
      if (doc.multipart && !file) {
        throw new Error('图片编辑需要先选择 image 文件。');
      }
      const headers = { Authorization: `Bearer ${apiKey.trim()}` };
      let payload;
      if (doc.method === 'POST') {
        if (doc.multipart) {
          const parsed = parseBody(body);
          const form = new FormData();
          Object.entries(parsed).forEach(([key, value]) => {
            form.append(key, typeof value === 'string' ? value : JSON.stringify(value));
          });
          form.append('image', file);
          payload = form;
        } else {
          headers['Content-Type'] = 'application/json';
          payload = body;
        }
      }

      const response = await fetch(`${baseUrl}${doc.path}`, {
        method: doc.method,
        headers,
        body: payload,
      });
      const text = await response.text();
      setResult({
        status: response.status,
        elapsedMs: Math.round(performance.now() - startedAt),
        body: prettyBody(text),
        ...extractPreview(text),
      });
    } catch (error) {
      setResult({
        status: 'client_error',
        elapsedMs: Math.round(performance.now() - startedAt),
        body: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className='right-card'>
      <div className='right-card-title'>
        <span className={`method method-${doc.method.toLowerCase()}`}>{doc.method}</span>
        <code>{doc.path}</code>
      </div>

      {doc.billable && <Tag color='orange'>{doc.billable}</Tag>}

      <Divider margin='16px' />

      <div className='right-row'>
        <Text strong>代码示例</Text>
        <Button size='small' icon={<IconCopy />} onClick={() => copyCode(code)}>
          复制
        </Button>
      </div>
      <Select
        value={language}
        onChange={setLanguage}
        optionList={codeLanguages}
        style={{ width: '100%', marginTop: 10, marginBottom: 10 }}
      />
      <CodeBlock compact code={code} />

      <Divider margin='18px' />

      <Text strong>Try it</Text>
      <Input
        value={apiKey}
        onChange={setApiKey}
        placeholder='sk-...'
        mode='password'
        autoComplete='off'
        style={{ marginTop: 10 }}
      />

      {doc.method === 'POST' && (
        <TextArea
          value={body}
          onChange={setBody}
          autosize={{ minRows: 8, maxRows: 14 }}
          className='request-editor'
        />
      )}

      {doc.multipart && (
        <input
          type='file'
          accept='image/png,image/jpeg,image/webp'
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className='file-input'
        />
      )}

      <Button
        theme='solid'
        type='primary'
        icon={<IconPlay />}
        loading={isRunning}
        onClick={runRequest}
        style={{ width: '100%', marginTop: 12 }}
      >
        Try it
      </Button>

      {result && (
        <div className='result-box'>
          <div className='right-row'>
            <Text strong>Response</Text>
            <Text type='tertiary' size='small' code>
              {result.status} · {result.elapsedMs}ms
            </Text>
          </div>
          {result.imageUrl && (
            <img src={result.imageUrl} alt='Generated result' className='result-image' />
          )}
          {result.mediaUrl && (
            <a href={result.mediaUrl} target='_blank' rel='noopener noreferrer'>
              打开媒体地址
            </a>
          )}
          <CodeBlock compact code={result.body} />
        </div>
      )}
    </div>
  );
}

function DocSection({ title, children }) {
  return (
    <section className='doc-section'>
      <Title heading={3}>{title}</Title>
      {children}
    </section>
  );
}

function ParameterTable({ rows, headers = ['参数', '类型', '必填', '说明'] }) {
  return (
    <div className='param-table-wrap'>
      <table className={`param-table param-table-${headers.length}`}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('|')}>
              {row.map((cell, index) => (
                <td key={`${row[0]}-${index}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoRows({ rows }) {
  return (
    <div className='info-rows'>
      {rows.map(([label, value]) => (
        <div key={label} className='info-row'>
          <Text type='tertiary'>{label}</Text>
          <code>{value}</code>
        </div>
      ))}
    </div>
  );
}

function OverviewCard({ title, text }) {
  return (
    <div className='overview-card'>
      <div>{title}</div>
      <Text type='secondary'>{text}</Text>
    </div>
  );
}

function CodeBlock({ code, compact = false }) {
  return (
    <pre className={`code-block ${compact ? 'compact' : ''}`}>
      <code>{code}</code>
    </pre>
  );
}

function getInitialDocId() {
  if (typeof window === 'undefined') return 'introduction';
  const hash = window.location.hash.replace(/^#/, '');
  return docs.some((item) => item.id === hash) ? hash : 'introduction';
}

function parseBody(body) {
  const parsed = JSON.parse(body);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Request body must be a JSON object.');
  }
  return parsed;
}

function buildCodeExample(baseUrl, doc, body, language) {
  if (language === 'python') return buildPythonExample(baseUrl, doc, body);
  if (language === 'javascript') return buildJavaScriptExample(baseUrl, doc, body);
  return buildCurlExample(baseUrl, doc, body);
}

function buildCurlExample(baseUrl, doc, body) {
  const url = `${baseUrl}${doc.path}`;
  if (doc.method === 'GET') {
    return [`curl --request GET \\`, `  --url ${url} \\`, `  --header "Authorization: Bearer $YOUR_API_KEY"`].join('\n');
  }
  if (doc.multipart) {
    let parsed = {};
    try {
      parsed = parseBody(body);
    } catch {
      parsed = {};
    }
    const lines = [`curl --request POST \\`, `  --url ${url} \\`, `  --header "Authorization: Bearer $YOUR_API_KEY" \\`];
    Object.entries(parsed).forEach(([key, value]) => {
      lines.push(`  --form '${key}=${typeof value === 'string' ? value : JSON.stringify(value)}' \\`);
    });
    lines.push(`  --form 'image=@input.png'`);
    return lines.join('\n');
  }
  return [
    `curl --request POST \\`,
    `  --url ${url} \\`,
    `  --header "Authorization: Bearer $YOUR_API_KEY" \\`,
    `  --header "Content-Type: application/json" \\`,
    `  --data '${body.replace(/\n/g, '\n          ')}'`,
  ].join('\n');
}

function buildPythonExample(baseUrl, doc, body) {
  const url = `${baseUrl}${doc.path}`;
  if (doc.multipart) {
    return [
      'import requests',
      '',
      `url = "${url}"`,
      'headers = {"Authorization": "Bearer $YOUR_API_KEY"}',
      `data = ${body}`,
      'files = {"image": open("input.png", "rb")}',
      '',
      'response = requests.post(url, headers=headers, data=data, files=files)',
      'print(response.json())',
    ].join('\n');
  }
  if (doc.method === 'GET') {
    return [
      'import requests',
      '',
      `url = "${url}"`,
      'headers = {"Authorization": "Bearer $YOUR_API_KEY"}',
      '',
      'response = requests.get(url, headers=headers)',
      'print(response.json())',
    ].join('\n');
  }
  return [
    'import requests',
    '',
    `url = "${url}"`,
    'headers = {',
    '    "Authorization": "Bearer $YOUR_API_KEY",',
    '    "Content-Type": "application/json",',
    '}',
    `payload = ${body}`,
    '',
    'response = requests.post(url, headers=headers, json=payload)',
    'print(response.json())',
  ].join('\n');
}

function buildJavaScriptExample(baseUrl, doc, body) {
  const url = `${baseUrl}${doc.path}`;
  if (doc.multipart) {
    return [
      `const form = new FormData();`,
      ...Object.entries(safeParseObject(body)).map(([key, value]) => {
        const rendered = typeof value === 'string' ? value : JSON.stringify(value);
        return `form.append("${key}", ${JSON.stringify(rendered)});`;
      }),
      `form.append("image", file);`,
      '',
      `const response = await fetch("${url}", {`,
      `  method: "POST",`,
      `  headers: { Authorization: "Bearer $YOUR_API_KEY" },`,
      `  body: form,`,
      `});`,
      `console.log(await response.json());`,
    ].join('\n');
  }
  return [
    `const response = await fetch("${url}", {`,
    `  method: "${doc.method}",`,
    `  headers: {`,
    `    Authorization: "Bearer $YOUR_API_KEY",`,
    ...(doc.method === 'POST' ? [`    "Content-Type": "application/json",`] : []),
    `  },`,
    ...(doc.method === 'POST' ? [`  body: JSON.stringify(${body.replace(/\n/g, '\n  ')}),`] : []),
    `});`,
    `console.log(await response.json());`,
  ].join('\n');
}

function safeParseObject(body) {
  try {
    return parseBody(body);
  } catch {
    return {};
  }
}

function prettyBody(text) {
  try {
    return JSON.stringify(redactLargeFields(JSON.parse(text)), null, 2);
  } catch {
    return text;
  }
}

function redactLargeFields(value) {
  if (typeof value === 'string') {
    return value.length > 1200 ? `${value.slice(0, 1200)}... [truncated]` : value;
  }
  if (Array.isArray(value)) return value.map(redactLargeFields);
  if (value && typeof value === 'object') {
    const next = {};
    Object.entries(value).forEach(([key, item]) => {
      next[key] = redactLargeFields(item);
    });
    return next;
  }
  return value;
}

function extractPreview(text) {
  try {
    const json = JSON.parse(text);
    const first = json?.data?.[0] || json?.output?.[0] || json;
    const b64 = first?.b64_json || first?.image_b64 || first?.image;
    if (typeof b64 === 'string' && b64.length > 100) {
      const mime = b64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
      return { imageUrl: `data:${mime};base64,${b64}` };
    }
    const url = first?.url || first?.public_url || first?.video_url || json?.url || json?.public_url;
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      return { mediaUrl: url };
    }
  } catch {
    // ignore preview parse errors
  }
  return {};
}

async function copyCode(text) {
  await navigator.clipboard?.writeText(text);
}

function DocsStyles() {
  return (
    <style>
      {`
        .docs-page-root {
          --semi-color-bg-0: var(--background);
          --semi-color-bg-1: var(--card);
          --semi-color-border: var(--border);
          --semi-color-fill-0: var(--muted);
          --semi-color-primary: var(--primary);
          --semi-color-primary-light-default: color-mix(in oklch, var(--primary) 12%, transparent);
          --semi-color-text-0: var(--foreground);
          --semi-color-text-1: color-mix(in oklch, var(--foreground) 86%, var(--background));
          --semi-color-text-2: var(--muted-foreground);
          background: var(--semi-color-bg-0);
          color: var(--semi-color-text-0);
          min-height: 100vh;
          padding-top: 60px;
        }

        .docs-layout {
          display: grid;
          grid-template-columns: 260px minmax(0, 740px) 430px;
          gap: 48px;
          max-width: 1500px;
          margin: 0 auto;
          padding: 0 28px 72px;
        }

        .docs-sidebar {
          position: sticky;
          top: 76px;
          align-self: start;
          height: calc(100vh - 92px);
          overflow: auto;
          padding: 22px 0;
          border-right: 1px solid var(--semi-color-border);
        }

        .docs-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--semi-color-text-0);
          font-weight: 700;
          text-decoration: none;
          margin-right: 18px;
        }

        .docs-brand-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--semi-color-primary);
          color: white;
          font-size: 14px;
        }

        .docs-search {
          margin: 22px 18px 18px 0;
          padding: 10px 12px;
          border: 1px solid var(--semi-color-border);
          border-radius: 10px;
          color: var(--semi-color-text-2);
          background: var(--semi-color-fill-0);
          font-size: 13px;
        }

        .docs-text-secondary {
          color: var(--semi-color-text-2);
        }

        .docs-text-tertiary {
          color: color-mix(in oklch, var(--semi-color-text-2) 82%, transparent);
        }

        .docs-text-strong {
          font-weight: 700;
        }

        .docs-text-small {
          font-size: 12px;
        }

        .docs-text-code {
          font-family: Menlo, Monaco, Consolas, monospace;
        }

        .docs-divider {
          height: 1px;
          background: var(--semi-color-border);
        }

        .docs-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 34px;
          border: 1px solid color-mix(in oklch, var(--semi-color-primary) 34%, var(--semi-color-border));
          border-radius: 8px;
          background: var(--semi-color-primary);
          color: var(--primary-foreground);
          padding: 0 14px;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: opacity .15s ease, transform .15s ease;
        }

        .docs-button.small {
          min-height: 28px;
          padding: 0 10px;
          font-size: 12px;
        }

        .docs-button:hover {
          opacity: .9;
        }

        .docs-button:disabled {
          cursor: not-allowed;
          opacity: .6;
        }

        .docs-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid color-mix(in oklch, var(--primary-foreground) 40%, transparent);
          border-top-color: var(--primary-foreground);
          border-radius: 999px;
          animation: docs-spin .8s linear infinite;
        }

        @keyframes docs-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .docs-input,
        .docs-select,
        .docs-textarea {
          width: 100%;
          border: 1px solid var(--semi-color-border);
          border-radius: 8px;
          background: var(--semi-color-bg-0);
          color: var(--semi-color-text-0);
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease;
        }

        .docs-input,
        .docs-select {
          height: 36px;
          padding: 0 11px;
          font-size: 13px;
        }

        .docs-textarea {
          resize: vertical;
          min-height: 190px;
          padding: 11px;
          font-size: 12px;
          line-height: 1.7;
        }

        .docs-input:focus,
        .docs-select:focus,
        .docs-textarea:focus {
          border-color: var(--semi-color-primary);
          box-shadow: 0 0 0 3px color-mix(in oklch, var(--semi-color-primary) 18%, transparent);
        }

        .docs-tag {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          min-height: 24px;
          border-radius: 999px;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 700;
          background: var(--semi-color-fill-0);
          color: var(--semi-color-text-1);
        }

        .docs-tag-orange {
          background: color-mix(in oklch, var(--warning) 18%, transparent);
          color: var(--warning-foreground);
        }

        .docs-nav {
          display: grid;
          gap: 22px;
          padding-right: 18px;
        }

        .docs-nav-title {
          margin: 0 0 8px;
          color: var(--semi-color-text-2);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .08em;
        }

        .docs-nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          border: 0;
          border-radius: 8px;
          padding: 8px 10px;
          color: var(--semi-color-text-1);
          background: transparent;
          text-align: left;
          cursor: pointer;
          transition: background .15s ease, color .15s ease;
        }

        .docs-nav-item:hover,
        .docs-nav-item.active {
          background: var(--semi-color-primary-light-default);
          color: var(--semi-color-primary);
        }

        .docs-content {
          min-width: 0;
          padding-top: 54px;
        }

        .docs-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: var(--semi-color-primary);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .docs-page-title {
          margin: 0 !important;
          font-size: 44px !important;
          line-height: 1.12 !important;
          letter-spacing: 0 !important;
        }

        .docs-lead {
          display: block;
          margin-top: 16px;
          max-width: 680px;
          font-size: 17px;
          line-height: 1.9;
        }

        .endpoint-line {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 28px;
          padding: 12px 14px;
          border: 1px solid var(--semi-color-border);
          border-radius: 10px;
          background: var(--semi-color-fill-0);
        }

        .endpoint-line code,
        .right-card-title code,
        .info-row code {
          font-family: Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          word-break: break-word;
        }

        .method {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 42px;
          height: 22px;
          padding: 0 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
        }

        .method-get {
          color: #047857;
          background: rgba(16, 185, 129, .12);
        }

        .method-post {
          color: #1d4ed8;
          background: rgba(59, 130, 246, .12);
        }

        .doc-section {
          margin-top: 46px;
        }

        .doc-section h3 {
          margin-bottom: 16px !important;
        }

        .param-table-wrap {
          overflow: auto;
          border: 1px solid var(--semi-color-border);
          border-radius: 12px;
        }

        .param-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          table-layout: fixed;
        }

        .param-table th,
        .param-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--semi-color-border);
          vertical-align: top;
          text-align: left;
          line-height: 1.7;
        }

        .param-table th {
          color: var(--semi-color-text-2);
          background: var(--semi-color-fill-0);
          font-size: 12px;
          font-weight: 700;
        }

        .param-table tr:last-child td {
          border-bottom: 0;
        }

        .param-table-3 th:nth-child(1),
        .param-table-3 td:nth-child(1) {
          width: 24%;
          white-space: nowrap;
        }

        .param-table-3 th:nth-child(2),
        .param-table-3 td:nth-child(2) {
          width: 28%;
          white-space: nowrap;
        }

        .param-table-3 th:nth-child(3),
        .param-table-3 td:nth-child(3) {
          width: 48%;
        }

        .param-table-4 th:nth-child(1),
        .param-table-4 td:nth-child(1) {
          width: 18%;
        }

        .param-table-4 th:nth-child(2),
        .param-table-4 td:nth-child(2),
        .param-table-4 th:nth-child(3),
        .param-table-4 td:nth-child(3) {
          width: 13%;
          white-space: nowrap;
        }

        .docs-list,
        .right-list {
          margin: 0;
          padding-left: 18px;
          color: var(--semi-color-text-1);
          line-height: 1.9;
        }

        .info-rows {
          display: grid;
          gap: 10px;
        }

        .info-row {
          display: grid;
          grid-template-columns: 150px minmax(0, 1fr);
          gap: 18px;
          padding: 14px 0;
          border-bottom: 1px solid var(--semi-color-border);
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .overview-card {
          border: 1px solid var(--semi-color-border);
          border-radius: 12px;
          padding: 18px;
          background: var(--semi-color-bg-1);
        }

        .overview-card > div {
          margin-bottom: 8px;
          font-weight: 700;
        }

        .docs-right {
          position: sticky;
          top: 76px;
          align-self: start;
          max-height: calc(100vh - 92px);
          overflow: auto;
          padding-top: 22px;
        }

        .right-card {
          border: 1px solid var(--semi-color-border);
          border-radius: 14px;
          background: var(--semi-color-bg-1);
          padding: 18px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, .04);
        }

        .right-card-title,
        .right-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .right-card-title {
          justify-content: flex-start;
          font-weight: 700;
        }

        .right-text {
          display: block;
          margin: 10px 0 14px;
          line-height: 1.8;
        }

        .request-editor {
          margin-top: 12px;
          font-family: Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
        }

        .file-input {
          display: block;
          margin-top: 12px;
          color: var(--semi-color-text-1);
        }

        .result-box {
          display: grid;
          gap: 12px;
          margin-top: 18px;
        }

        .result-image {
          width: 100%;
          max-height: 260px;
          object-fit: contain;
          border: 1px solid var(--semi-color-border);
          border-radius: 12px;
        }

        .code-block {
          margin: 0;
          padding: 16px;
          border: 1px solid var(--semi-color-border);
          border-radius: 12px;
          background: var(--semi-color-fill-0);
          color: var(--semi-color-text-0);
          overflow: auto;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 13px;
          line-height: 1.75;
        }

        .code-block.compact {
          max-height: 310px;
          font-size: 12px;
        }

        .code-block code {
          font-family: Menlo, Monaco, Consolas, monospace;
        }

        @media (max-width: 1280px) {
          .docs-layout {
            grid-template-columns: 230px minmax(0, 1fr);
            gap: 34px;
          }
          .docs-right {
            position: static;
            grid-column: 2;
            max-height: none;
          }
        }

        @media (max-width: 860px) {
          .docs-layout {
            display: block;
            padding: 0 18px 48px;
          }
          .docs-sidebar {
            position: static;
            height: auto;
            border-right: 0;
            border-bottom: 1px solid var(--semi-color-border);
          }
          .docs-content {
            padding-top: 32px;
          }
          .docs-page-title {
            font-size: 34px !important;
          }
          .overview-grid,
          .info-row {
            grid-template-columns: 1fr;
          }
          .param-table th,
          .param-table td {
            white-space: normal !important;
          }
        }
      `}
    </style>
  );
}

export default Docs;
