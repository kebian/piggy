import EventEmitter from 'eventemitter3'

interface Events {
    ready: () => void
}

type ResourceType = 'image' | 'audio'

export interface Resource {
    type: ResourceType
}

export interface AudioResource extends Resource {
    type: 'audio'
    audio: HTMLAudioElement
}

export interface ImageResource extends Resource {
    type: 'image'
    image: HTMLImageElement
}

class ResourceCache extends EventEmitter<Events> {
    private cache: Map<string, Resource>

    constructor() {
        super()
        this.cache = new Map()
    }

    private loadSingleResource(url: string) {
        return new Promise<Resource>((resolve, reject) => {
            // Check to see if it's already loaded
            const existing = this.cache.get(url)
            if (existing !== undefined) {
                resolve(existing)
                return
            }

            switch (this.fileExt(url)) {
                case 'png':
                case 'jpeg':
                case 'jpg':
                case 'gif':
                    const image = new Image()
                    image.onload = () => {
                        const resource: ImageResource = { type: 'image', image }
                        this.cache.set(url, resource)
                        console.log('loaded', url)
                        image.onload = null
                        resolve(resource)
                    }
                    image.onerror = e => reject(e)
                    image.src = url
                    break
                case 'mp3':
                    const audio = new Audio()
                    audio.oncanplay = () => {
                        const resource: AudioResource = { type: 'audio', audio }
                        this.cache.set(url, resource)
                        console.log('loaded', url)
                        audio.oncanplay = null
                        resolve(resource)
                    }
                    audio.onerror = e => reject(e)
                    audio.src = url
                    break
                default:
                    reject(`Unknown resource type: ${url}`)
            }
        })
    }

    private async createImageResource(name: string, url: string): Promise<ImageResource> {
        return new Promise((resolve, reject) => {
            const image = new Image()
            image.onload = () => {
                const resource: ImageResource = { type: 'image', image }
                this.cache.set(name, resource)
                console.log('loaded', name)
                image.onload = null
                resolve(resource)
            }
            image.onerror = e => reject(e)
            image.src = url
        })
    }

    private async createAudioResource(name: string, url: string): Promise<AudioResource> {
        return new Promise((resolve, reject) => {
            const audio = new Audio()
            audio.oncanplay = () => {
                const resource: AudioResource = { type: 'audio', audio }
                this.cache.set(name, resource)
                console.log('loaded', name)
                audio.oncanplay = null
                resolve(resource)
            }
            audio.onerror = e => reject(e)
            audio.src = url
        })
    }

    private fileExt(filename: string) {
        return filename.split('.').pop()
    }

    async loadUrls(urls: string[]) {
        await Promise.all(urls.map(url => this.loadSingleResource(url)))
        this.emit('ready')
    }

    async loadImports(items: { name: string; data: string }[]) {
        for (const item of items) {
            if (item.data.startsWith('data:image')) await this.createImageResource(item.name, item.data)
            else if (item.data.startsWith('data:audio')) await this.createAudioResource(item.name, item.data)
        }
        this.emit('ready')
    }

    get(name: string) {
        const resource = this.cache.get(name)
        if (resource === undefined) throw new Error(`Resource not loaded: ${name}`)
        return resource
    }
}

export default ResourceCache
