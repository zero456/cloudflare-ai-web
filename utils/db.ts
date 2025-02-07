import Dexie, {type Table} from 'dexie';

export class Database extends Dexie {
    history!: Table<HistoryItem>
    tab!: Table<TabItem>

    constructor() {
        super('ai')
        this.version(4).stores({
            history: '++id, session, type, role, content, src',
            tab: '++id, label'
        })
        this.version(5).stores({
            tab: '++id, label, created_at',
            history: '++id, session, type, role, content, src, created_at',
        }).upgrade(trans => {
            return trans.table('history').toCollection().modify(async i => {
                if (i.type === 'image') {
                    i.content = ''
                    i.src = [i.src]
                }
            })
        })
    }

    getLatestTab() {
        return DB.tab.orderBy('id').last();
    }

    getTabs() {
        return DB.tab.limit(100).reverse().toArray()
    }

    async getHistory(session: number) {
        const arr = await DB.history.where('session').equals(session).limit(100).toArray()
        arr.forEach(i => {
            if (i.type === 'image') {
                i.src_url = []
                i.src?.forEach(src => {
                    i.src_url!.push(URL.createObjectURL(src))
                })
                i.content = 'image'
            }
        })
        return arr
    }

    addTab(label: string) {
        return DB.tab.add({label, created_at: Date.now()})
    }

    deleteTabAndHistory(id: number) {
        return DB.transaction('rw', DB.tab, DB.history, async () => {
            await DB.tab.delete(id)
            await DB.history.where('session').equals(id).delete()
        })
    }
}

export const DB = new Database();

export const initialSettings = {
    openaiKey: '',
    image_steps: 20,
    system_prompt: '你是一位博学的专家，用中文给出简洁而准确的回答。',
}

export type Settings = typeof initialSettings

export const uniModals: Model[] = [    
    {
        id: 'gemini-2.0-flash-lite-preview-02-05',
        name: 'Gemini 2.0 Flash Lite',
        provider: 'google',
        type: 'universal'
    },
    {
        id: 'gemini-2.0-flash-thinking-exp-01-21',
        name: 'Gemini 2.0 Flash Thinking',
        provider: 'google',
        type: 'universal'
    },
    {
        id: 'gemini-2.0-pro-exp-02-05',
        name: 'Gemini 2.0 Pro',
        provider: 'google',
        type: 'universal'
    },
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 flash',
        provider: 'google',
        type: 'universal'
    }
]

export const textGenModels: Model[] = [{
    id: 'o3-mini',
    name: 'o3 mini',
    provider: 'openai',
    endpoint: 'chat/completions',
    type: 'chat'
},{
    id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    name: 'deepseek r1 distill qwen 32b',
    provider: 'workers-ai',
    type: 'chat'
},{
    id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    name: 'llama 3.3 70b',
    provider: 'workers-ai',
    type: 'chat'
}, {
    id: '@cf/meta/llama-3.2-11b-vision-instruct',
    name: 'llama 3.2 11b vision',
    provider: 'workers-ai',
    type: 'chat'
}]

export const imageGenModels: Model[] = [{
    id: '@cf/lykon/dreamshaper-8-lcm',
    name: 'dreamshaper-8-lcm',
    provider: 'workers-ai-image',
    type: 'text-to-image'
}, {
    id: '@cf/black-forest-labs/flux-1-schnell',
    name: 'flux-1-schnell',
    provider: 'workers-ai-image',
    type: 'text-to-image'
}, {
    id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    name: 'stable-diffusion-xl-base-1.0',
    provider: 'workers-ai-image',
    type: 'text-to-image'
}, {
    id: '@cf/bytedance/stable-diffusion-xl-lightning',
    name: 'stable-diffusion-xl-lightning',
    provider: 'workers-ai-image',
    type: 'text-to-image'
}]

export const models: Model[] = [...uniModals, ...textGenModels, ...imageGenModels]