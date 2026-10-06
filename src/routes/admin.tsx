import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import products, { type Product, type ProductCategory } from '@/data/products'
import type { CatalogAdditions, CatalogOverrides, CatalogSettings, ProductOverride } from '@/lib/catalog'

export const Route = createFileRoute('/admin')({ component: AdminPage })

type AdminTab = 'inicio' | 'estatisticas' | 'novo' | 'ativos' | 'ocultos' | 'estoqueZero' | 'excluidos' | 'configuracoes'
type AnalyticsStats = { visits: number; productViews: number; whatsappClicks: number; instagramClicks: number; products: Record<string, { name: string; views: number; whatsappClicks: number }>; days: Record<string, { visits: number; productViews: number; whatsappClicks: number; instagramClicks: number }> }
const categories: ProductCategory[] = ['Anéis', 'Brincos', 'Colares', 'Pulseiras', 'Tornozeleiras', 'Conjuntos', 'Outros']

const defaultSettings: CatalogSettings = {
  instagramUrl: 'https://www.instagram.com/trivellejoias/',
  whatsappNumber: '5519982124939',
  whatsappMessage: 'Olá! Vim pelo catálogo da Trivelle e gostaria de saber mais sobre as peças.',
  productOrder: [],
}

function AdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [overrides, setOverrides] = useState<CatalogOverrides>({})
  const [additions, setAdditions] = useState<CatalogAdditions>({})
  const [settings, setSettings] = useState<CatalogSettings>(defaultSettings)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [storageReady, setStorageReady] = useState(true)
  const [savedMessage, setSavedMessage] = useState('')
  const [tab, setTab] = useState<AdminTab>('inicio')
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')
  const [draggedProductId, setDraggedProductId] = useState<number | null>(null)
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { const session = sessionStorage.getItem('trivelle-admin-auth'); if (session === 'ok') setAuthorized(true); setChecking(false) }, [])

  async function loadData() {
    const [catalogResponse, settingsResponse, additionsResponse] = await Promise.all([
      fetch('/catalog-data', { cache: 'no-store' }),
      fetch('/catalog-data?type=settings', { cache: 'no-store' }),
      fetch('/catalog-data?type=additions', { cache: 'no-store' }),
    ])
    if (!catalogResponse.ok) {
      let detail = ''
      try { detail = String(((await catalogResponse.json()) as { error?: unknown })?.error ?? '') } catch {}
      if (catalogResponse.status === 503 || detail === 'storage_not_configured' || detail === 'storage_binding_invalid') {
        setStorageReady(false)
        throw new Error('O armazenamento do Cloudflare não está disponível. Confira o binding KV CATALOG_KV e faça um novo deploy.')
      }
      setStorageReady(true)
      throw new Error('Não foi possível carregar os dados do catálogo.')
    }
    const catalog = await catalogResponse.json()
    const remoteSettings = settingsResponse.ok ? await settingsResponse.json() : {}
    const remoteAdditions = additionsResponse.ok ? await additionsResponse.json() : {}
    setOverrides(catalog ?? {})
    setSettings((prev) => ({ ...prev, ...(remoteSettings ?? {}) }))
    setAdditions(remoteAdditions ?? {})
    setLoaded(true)
  }

  useEffect(() => {
    if (!authorized) return
    loadData().catch((error) => {
      setSavedMessage(error instanceof Error ? error.message : 'Não foi possível carregar o catálogo.')
      setLoaded(true)
    })
  }, [authorized])

  async function login() {
    setLoginError('')
    try {
      const response = await fetch('/admin-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      if (!response.ok) {
        let detail = ''
        try { detail = String(((await response.json()) as { error?: unknown })?.error ?? '') } catch {}
        if (response.status === 503 || detail === 'admin_password_not_configured') {
          throw new Error('A senha ADMIN_PASSWORD ainda não foi configurada no Cloudflare.')
        }
        throw new Error('Senha incorreta. Tente novamente.')
      }
      sessionStorage.setItem('trivelle-admin-auth', 'ok'); sessionStorage.setItem('trivelle-admin-password', password); setAuthorized(true); setPassword('')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Não foi possível entrar no painel.')
    }
  }

  const allProducts = useMemo<Product[]>(() => {
    const base = [...products, ...Object.values(additions)]
    const order = settings.productOrder ?? []
    const rank = new Map(order.map((id, index) => [id, index]))
    return base.sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
  }, [additions, settings.productOrder])

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allProducts.filter((p) => {
      const o = overrides[String(p.id)] ?? {}
      const stock = o.stock ?? p.stock ?? 0
      const isDeleted = Boolean(o.deleted)
      const isHidden = Boolean(o.hidden) && !isDeleted
      const isStockZero = !isDeleted && !isHidden && stock <= 0
      const isActive = !isDeleted && !isHidden && stock > 0
      const matchesTab = tab === 'excluidos' ? isDeleted : tab === 'ocultos' ? isHidden : tab === 'estoqueZero' ? isStockZero : tab === 'ativos' ? isActive : false
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || String(p.id).includes(q)
      return matchesTab && matchesSearch
    })
  }, [query, overrides, allProducts, tab])

  const counts = useMemo(() => {
    let ativos = 0, ocultos = 0, excluidos = 0, estoqueZero = 0
    for (const p of allProducts) {
      const o = overrides[String(p.id)] ?? {}
      const stock = o.stock ?? p.stock ?? 0
      if (o.deleted) excluidos++
      else if (o.hidden) ocultos++
      else if (stock <= 0) estoqueZero++
      else ativos++
    }
    return { ativos, ocultos, excluidos, estoqueZero, total: allProducts.length }
  }, [overrides, allProducts])

  const current = selected == null ? null : allProducts.find((p) => p.id === selected) ?? null
  const currentOverride = current ? (overrides[String(current.id)] ?? {}) : {}
  const currentImages = currentOverride.images ?? current?.images ?? []

  function update(id: number, patch: ProductOverride) {
    if (String(id) in additions) {
      setAdditions((prev) => ({ ...prev, [String(id)]: { ...prev[String(id)], ...patch } as Product }))
    } else {
      setOverrides((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] ?? {}), ...patch } }))
    }
    setSavedMessage('Alteração pendente — clique em “Salvar alterações”.')
  }

  function updateSettings(patch: CatalogSettings) { setSettings((prev) => ({ ...prev, ...patch })); setSavedMessage('Alteração pendente — clique em “Salvar alterações”.') }

  function setProductOrder(ids: number[]) { updateSettings({ productOrder: ids }) }

  function moveProduct(id: number, direction: -1 | 1) {
    const ids = allProducts.map((p) => p.id)
    const index = ids.indexOf(id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    setProductOrder(ids)
  }

  function dropProduct(targetId: number) {
    if (draggedProductId == null || draggedProductId === targetId) return
    const ids = allProducts.map((p) => p.id)
    const from = ids.indexOf(draggedProductId); const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(from, 1); ids.splice(to, 0, draggedProductId)
    setProductOrder(ids); setDraggedProductId(null)
  }

  function replaceImages(images: string[]) { if (current) update(current.id, { images, image: images[0] ?? '' }) }

  function deleteImage(id: number, index: number) {
    const p = allProducts.find((x) => x.id === id); if (!p) return
    const o = overrides[String(id)] ?? {}
    const images = [...(o.images ?? p.images ?? [])]
    images.splice(index, 1)
    update(id, { images, image: images[0] ?? '' })
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= currentImages.length) return
    const images = [...currentImages]
    ;[images[index], images[target]] = [images[target], images[index]]
    replaceImages(images)
  }

  function dropImage(targetIndex: number) {
    if (draggedImageIndex == null || draggedImageIndex === targetIndex) return
    const images = [...currentImages]
    const [moved] = images.splice(draggedImageIndex, 1)
    if (moved == null) return
    images.splice(targetIndex, 0, moved)
    replaceImages(images); setDraggedImageIndex(null)
  }

  function resizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
      reader.onload = () => {
        const img = new Image()
        img.onerror = () => reject(new Error('Arquivo de imagem inválido.'))
        img.onload = () => {
          const max = 1400
          const scale = Math.min(1, max / Math.max(img.width, img.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.round(img.width * scale))
          canvas.height = Math.max(1, Math.round(img.height * scale))
          const ctx = canvas.getContext('2d')
          if (!ctx) return reject(new Error('Seu navegador não conseguiu processar a imagem.'))
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/webp', 0.78))
        }
        img.src = String(reader.result)
      }
      reader.readAsDataURL(file)
    })
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    if (!current || !event.target.files?.length) return
    setSavedMessage('Processando fotos…')
    try {
      const added: string[] = []
      for (const file of Array.from(event.target.files)) {
        if (!file.type.startsWith('image/')) continue
        added.push(await resizeImage(file))
      }
      replaceImages([...currentImages, ...added])
      setSavedMessage(`${added.length} foto(s) adicionada(s). Clique em “Salvar alterações”.`)
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : 'Não foi possível adicionar as fotos.')
    } finally {
      event.target.value = ''
    }
  }

  function addProduct() {
    const id = -Date.now()
    const newProduct: Product = { id, stock: 1, name: 'Novo produto', category: 'Outros', image: '', images: [], description: '', shortDescription: '', price: 0 }
    setAdditions((prev) => ({ ...prev, [String(id)]: newProduct }))
    setProductOrder([...allProducts.map((p) => p.id), id])
    setSelected(id); setTab('ativos'); setQuery(''); setSavedMessage('Novo produto criado. Preencha os dados e clique em Salvar alterações.')
  }

  async function saveChanges() {
    const adminPassword = sessionStorage.getItem('trivelle-admin-password')
    if (!adminPassword) { setSavedMessage('Sua sessão expirou. Entre novamente.'); setAuthorized(false); return }
    setSavedMessage('Salvando…')
    try {
      const response = await fetch('/catalog-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: adminPassword, overrides, additions, settings }) })
      if (!response.ok) {
        let detail = ''
        try { detail = String(((await response.json()) as { error?: unknown })?.error ?? '') } catch {}
        if (response.status === 503 || detail === 'storage_not_configured' || detail === 'storage_binding_invalid') {
          throw new Error('O armazenamento do Cloudflare não está disponível. Vincule o KV como CATALOG_KV e faça um novo deploy.')
        }
        if (response.status === 401) {
          throw new Error('Sua senha de administrador não foi aceita. Entre novamente.')
        }
        throw new Error('O servidor recusou o salvamento.')
      }
      setSavedMessage('✓ Tudo salvo no catálogo para todas as clientes.'); window.setTimeout(() => setSavedMessage(''), 5000)
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : 'Não foi possível salvar. Verifique sua conexão e tente novamente.')
    }
  }

  async function loadStats() {
    const adminPassword = sessionStorage.getItem('trivelle-admin-password'); if (!adminPassword) return
    setStatsLoading(true); setStatsError('')
    try {
      const response = await fetch('/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stats', password: adminPassword }) })
      if (!response.ok) throw new Error()
      setStats(await response.json() as AnalyticsStats)
    } catch {
      setStatsError('Não foi possível carregar as estatísticas agora.')
    } finally { setStatsLoading(false) }
  }

  async function refreshFromServer() { try { await loadData(); setSavedMessage('✓ Dados recarregados do servidor.'); window.setTimeout(() => setSavedMessage(''), 4000) } catch { setSavedMessage('Não foi possível recarregar os dados.') } }

  if (checking) return <div className="min-h-screen p-8">Verificando acesso…</div>
  if (!authorized) return <div className="min-h-screen bg-[#fffdfc] flex items-center justify-center px-6"><div className="w-full max-w-md bg-white rounded-3xl border p-8 shadow-sm"><Link to="/" className="text-sm underline">← Voltar ao catálogo</Link><h1 className="font-display text-3xl mt-8">Área administrativa</h1><p className="text-sm opacity-70 mt-2 mb-6">Esta área é exclusiva da Trivelle.</p><label className="block text-sm">Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} className="mt-1 w-full rounded-xl border px-4 py-3" autoComplete="current-password" /></label>{loginError && <p className="text-sm text-red-600 mt-3">{loginError}</p>}<button onClick={login} className="w-full mt-5 rounded-full px-5 py-3 bg-[color:var(--color-brand-dark)] text-white">Entrar</button></div></div>
  if (!loaded) return <div className="min-h-screen p-8">Carregando painel…</div>
  if (!storageReady) return <div className="min-h-screen bg-[#fffdfc] px-6 py-12"><div className="max-w-2xl mx-auto bg-white rounded-3xl border p-8 shadow-sm"><Link to="/" className="text-sm underline">← Voltar ao catálogo</Link><h1 className="font-display text-3xl mt-8">Painel administrativo</h1><div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-semibold text-lg">Falta conectar o armazenamento do Cloudflare</h2><p className="text-sm mt-2 leading-relaxed">O painel entrou corretamente, mas o Worker não encontrou o binding <strong>CATALOG_KV</strong>. Sem ele, o Cloudflare não tem onde guardar preços, estoque, fotos e configurações.</p><ol className="text-sm mt-4 space-y-2 list-decimal pl-5"><li>Abra o Worker <strong>trivellejoias</strong> no Cloudflare.</li><li>Vá em <strong>Settings → Bindings</strong>.</li><li>Adicione um <strong>KV namespace</strong> com a variável <strong>CATALOG_KV</strong>.</li><li>Faça um novo deploy e volte para esta página.</li></ol></div><button onClick={() => window.location.reload()} className="mt-6 rounded-full px-5 py-3 bg-[color:var(--color-brand-dark)] text-white">↻ Verificar novamente</button></div></div>

  const nav: [AdminTab, string][] = [['inicio', '📊 Início'], ['estatisticas', '📈 Estatísticas'], ['novo', '➕ Novo produto'], ['ativos', `💎 Ativos (${counts.ativos})`], ['ocultos', `👁 Ocultos (${counts.ocultos})`], ['estoqueZero', `📦 Sem estoque (${counts.estoqueZero})`], ['excluidos', `🗑 Excluídos (${counts.excluidos})`], ['configuracoes', '⚙️ Configurações']]

  return <div className="min-h-screen bg-[#fffdfc] p-4 md:p-8"><div className="max-w-7xl mx-auto">
    <header className="sticky top-0 z-30 bg-[#fffdfc]/95 backdrop-blur py-3 mb-5 border-b"><div className="flex flex-wrap items-center justify-between gap-3"><div><Link to="/" className="text-sm underline">← Ver catálogo</Link><h1 className="font-display text-3xl md:text-4xl mt-2">Painel Trivelle</h1><p className="text-sm opacity-65">Gerencie produtos, fotos, estoque e ordem do catálogo.</p></div><div className="flex items-center gap-2"><button onClick={refreshFromServer} className="rounded-full px-4 py-2 border text-sm">↻ Recarregar</button><button onClick={saveChanges} className="rounded-full px-5 py-2.5 bg-[color:var(--color-brand-dark)] text-white font-medium">💾 Salvar alterações</button></div></div>{savedMessage && <div className="mt-3 rounded-xl bg-[color:var(--color-brand-light)] px-4 py-2 text-sm text-[color:var(--color-brand-dark)]">{savedMessage}</div>}</header>

    <nav className="flex gap-2 overflow-x-auto pb-2 mb-6">{nav.map(([value, label]) => <button key={value} onClick={() => { setTab(value); setSelected(null); if (value === 'estatisticas') loadStats() }} className={`whitespace-nowrap rounded-full px-4 py-2.5 border text-sm font-medium ${tab === value ? 'bg-[color:var(--color-brand-dark)] text-white border-[color:var(--color-brand-dark)]' : 'bg-white border-gray-200 hover:bg-[color:var(--color-brand-light)]'}`}>{label}</button>)}</nav>

    {tab === 'inicio' && <div className="space-y-6"><div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{[['Produtos', counts.total, '📦'], ['Ativos', counts.ativos, '💎'], ['Ocultos', counts.ocultos, '👁'], ['Sem estoque', counts.estoqueZero, '📦'], ['Excluídos', counts.excluidos, '🗑']].map(([label, value, icon]) => <div key={String(label)} className="bg-white rounded-2xl border p-5"><div className="text-2xl">{icon}</div><div className="text-2xl font-semibold mt-3">{value}</div><div className="text-sm opacity-60">{label}</div></div>)}</div><div className="grid lg:grid-cols-3 gap-4"><button onClick={addProduct} className="bg-white rounded-2xl border p-6 text-left hover:shadow-md"><div className="text-3xl">➕</div><h2 className="font-display text-2xl mt-3">Adicionar produto</h2><p className="text-sm opacity-60 mt-1">Cadastre uma peça nova sem mexer no código.</p></button><button onClick={() => setTab('ativos')} className="bg-white rounded-2xl border p-6 text-left hover:shadow-md"><div className="text-3xl">💎</div><h2 className="font-display text-2xl mt-3">Editar produtos</h2><p className="text-sm opacity-60 mt-1">Fotos, título, preço, estoque e ordem.</p></button><button onClick={() => setTab('configuracoes')} className="bg-white rounded-2xl border p-6 text-left hover:shadow-md"><div className="text-3xl">📲</div><h2 className="font-display text-2xl mt-3">Redes e contato</h2><p className="text-sm opacity-60 mt-1">Instagram e WhatsApp do catálogo.</p></button></div></div>}

    {tab === 'estatisticas' && <div className="bg-white rounded-2xl border p-6"><div className="flex justify-between items-center"><h2 className="font-display text-2xl">Estatísticas</h2><button onClick={loadStats} className="rounded-full px-4 py-2 border text-sm">Atualizar</button></div>{statsLoading && <p className="mt-6 opacity-60">Carregando…</p>}{statsError && <p className="mt-6 text-red-600">{statsError}</p>}{stats && <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">{[['Visitas', stats.visits], ['Visualizações de produtos', stats.productViews], ['Cliques no WhatsApp', stats.whatsappClicks], ['Cliques no Instagram', stats.instagramClicks]].map(([label,value])=><div key={String(label)} className="rounded-2xl border p-5"><div className="text-2xl font-semibold">{value}</div><div className="text-sm opacity-60 mt-1">{label}</div></div>)}</div>}</div>}

    {tab === 'novo' && <div className="bg-white rounded-2xl border p-6"><h2 className="font-display text-2xl">Novo produto</h2><p className="text-sm opacity-65 mt-2">Crie uma peça e depois edite fotos, preço e estoque.</p><button onClick={addProduct} className="mt-6 rounded-full px-6 py-3 bg-[color:var(--color-brand-dark)] text-white">➕ Criar produto</button></div>}

    {tab === 'configuracoes' && <div className="bg-white rounded-2xl border p-6 max-w-2xl space-y-5"><h2 className="font-display text-2xl">Configurações</h2><label className="block text-sm font-medium">Instagram<input className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={settings.instagramUrl ?? ''} onChange={(e)=>updateSettings({instagramUrl:e.target.value})}/></label><label className="block text-sm font-medium">WhatsApp<input className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={settings.whatsappNumber ?? ''} onChange={(e)=>updateSettings({whatsappNumber:e.target.value})}/></label><label className="block text-sm font-medium">Mensagem do WhatsApp<textarea rows={3} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={settings.whatsappMessage ?? ''} onChange={(e)=>updateSettings({whatsappMessage:e.target.value})}/></label><button onClick={saveChanges} className="rounded-full px-6 py-3 bg-[color:var(--color-brand-dark)] text-white">💾 Salvar alterações</button></div>}

    {(['ativos','ocultos','estoqueZero','excluidos'] as AdminTab[]).includes(tab) && <div className="grid md:grid-cols-[330px_1fr] gap-6"><aside className="bg-white rounded-2xl border p-4 h-fit md:sticky md:top-28"><div className="flex items-center justify-between mb-3"><span className="text-xs opacity-60">{filteredProducts.length} anúncio(s)</span>{query && <button onClick={() => setQuery('')} className="text-xs underline">Limpar</button>}</div><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔎 Buscar nome ou ID" className="w-full rounded-xl border px-4 py-3 mb-4" /><p className="text-xs opacity-55 mb-3">Arraste um produto para mudar sua ordem. Você também pode usar ↑ e ↓.</p><div className="max-h-[70vh] overflow-auto space-y-2">{filteredProducts.map((p) => { const o=overrides[String(p.id)]??{}; const stock=o.stock??p.stock??0; return <div key={p.id} draggable onDragStart={()=>setDraggedProductId(p.id)} onDragOver={(e)=>e.preventDefault()} onDrop={()=>dropProduct(p.id)} className={`rounded-xl border ${selected===p.id?'border-[color:var(--color-brand)] bg-[color:var(--color-brand-light)]':'border-gray-200'}`}><button onClick={() => setSelected(p.id)} className="w-full text-left p-3"><div className="flex gap-3 items-center"><img src={o.image||p.image||'/placeholder.png'} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-100 border"/><div className="min-w-0"><div className="text-sm font-medium line-clamp-2">{o.name??p.name}</div><div className="text-xs opacity-60 mt-1">{p.category} · estoque {stock}</div></div></div></button><div className="flex gap-1 px-3 pb-3"><button type="button" title="Subir" onClick={()=>moveProduct(p.id,-1)} className="rounded-lg border px-2 py-1 text-xs">↑</button><button type="button" title="Descer" onClick={()=>moveProduct(p.id,1)} className="rounded-lg border px-2 py-1 text-xs">↓</button><span className="text-[11px] opacity-50 self-center ml-1">Arraste para ordenar</span></div></div>})}{filteredProducts.length===0&&<p className="text-sm opacity-60 py-5 text-center">Nenhum anúncio nesta aba.</p>}</div></aside>

      <section className="bg-white rounded-2xl border p-5 md:p-7">{!current?<div className="py-20 text-center opacity-60"><div className="text-5xl mb-3">💎</div><p>Selecione um produto para editar.</p></div>:<><div className="flex flex-wrap items-start justify-between gap-4 mb-7"><div><div className="text-xs opacity-60">ID {current.id} · {current.category}</div><h2 className="font-display text-2xl mt-1">{currentOverride.name??current.name}</h2></div><div className="flex flex-wrap gap-2">{currentOverride.deleted?<button onClick={()=>update(current.id,{deleted:false})} className="rounded-full px-4 py-2 text-sm border">↩ Restaurar</button>:currentOverride.hidden?<button onClick={()=>update(current.id,{hidden:false})} className="rounded-full px-4 py-2 text-sm border">↩ Mostrar</button>:<><button onClick={()=>update(current.id,{hidden:true})} className="rounded-full px-4 py-2 text-sm border">👁 Ocultar</button><button onClick={()=>update(current.id,{deleted:true,hidden:false})} className="rounded-full px-4 py-2 text-sm border border-red-200 text-red-700">🗑 Excluir</button></>}</div></div>
        <div className="grid lg:grid-cols-[1fr_340px] gap-7"><div className="space-y-5"><label className="block text-sm font-medium">Título<input className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.name??current.name} onChange={(e)=>update(current.id,{name:e.target.value})}/></label><div className="grid sm:grid-cols-2 gap-4"><label className="block text-sm font-medium">Preço (R$)<input type="number" min="0" step="0.01" className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.price??current.price} onChange={(e)=>update(current.id,{price:Math.max(0,Number(e.target.value))})}/></label><label className="block text-sm font-medium">Estoque<input type="number" min="0" step="1" className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.stock??current.stock} onChange={(e)=>update(current.id,{stock:Math.max(0,Math.floor(Number(e.target.value)))})}/></label></div><label className="block text-sm font-medium">Categoria<select className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.category??current.category} onChange={(e)=>update(current.id,{category:e.target.value as ProductCategory})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="block text-sm font-medium">Descrição<textarea rows={8} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.description??current.description} onChange={(e)=>update(current.id,{description:e.target.value})}/></label><label className="block text-sm font-medium">Descrição curta<textarea rows={3} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" value={currentOverride.shortDescription??current.shortDescription} onChange={(e)=>update(current.id,{shortDescription:e.target.value})}/></label></div>
          <div><div className="flex items-center justify-between gap-3 mb-2"><div><div className="text-sm font-medium">Fotos do produto</div><p className="text-xs opacity-55 mt-1">Escolha direto da galeria. A primeira foto é a principal.</p></div><button type="button" onClick={()=>fileInputRef.current?.click()} className="rounded-full px-4 py-2 bg-[color:var(--color-brand-dark)] text-white text-xs font-medium">📷 Escolher fotos</button><input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload}/></div><div className="space-y-4">{currentImages.map((img,i)=><div key={`${img}-${i}`} draggable onDragStart={()=>setDraggedImageIndex(i)} onDragOver={(e)=>e.preventDefault()} onDrop={()=>dropImage(i)} className="rounded-2xl border p-3 bg-[#fffdfc]"><div className="aspect-square rounded-xl overflow-hidden bg-gray-100"><img src={img || '/placeholder.png'} alt={`Foto ${i+1}`} className="w-full h-full object-contain"/></div><div className="flex flex-wrap gap-2 mt-2"><button type="button" onClick={()=>moveImage(i,-1)} disabled={i===0} className="rounded-full px-3 py-1.5 border text-xs disabled:opacity-30">↑</button><button type="button" onClick={()=>moveImage(i,1)} disabled={i===currentImages.length-1} className="rounded-full px-3 py-1.5 border text-xs disabled:opacity-30">↓</button><button type="button" onClick={()=>deleteImage(current.id,i)} className="rounded-full px-3 py-1.5 border text-xs text-red-700">🗑 Remover</button>{i===0&&<span className="text-xs opacity-50 self-center">Principal</span>}<span className="text-xs opacity-50 self-center ml-auto">Arraste para ordenar</span></div></div>)}</div><button type="button" onClick={()=>fileInputRef.current?.click()} className="w-full mt-3 rounded-xl border px-4 py-3 text-sm hover:bg-[color:var(--color-brand-light)]">＋ Adicionar fotos da galeria</button><details className="mt-3"><summary className="cursor-pointer text-xs opacity-60">Ou adicionar por URL</summary>{currentImages.map((img,i)=><input key={`url-${i}`} value={img} onChange={e=>{const images=[...currentImages]; images[i]=e.target.value; update(current.id,{images,image:images[0]??''})}} placeholder={`URL da foto ${i+1}`} className="mt-2 w-full rounded-xl border px-3 py-2 text-xs"/>)}</details></div></div><div className="mt-8 pt-5 border-t flex flex-wrap gap-3 items-center"><button onClick={saveChanges} className="rounded-full px-6 py-3 bg-[color:var(--color-brand-dark)] text-white font-medium">💾 Salvar alterações</button><span className="text-xs opacity-60">Salva no servidor para todas as clientes.</span></div></>}</section></div>}
  </div></div>
}
