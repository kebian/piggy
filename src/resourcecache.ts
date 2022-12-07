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
    private fixedAudioPerms: boolean

    constructor() {
        super()
        this.cache = new Map()
        this.fixedAudioPerms = false
    }

    cleanUp() {
        for (const resource of this.cache.values()) {
            if (resource.type === 'audio') {
                const audio = (resource as AudioResource).audio
                audio.src = ''
            } else {
                const image = (resource as ImageResource).image
                image.src = ''
            }
        }
        this.cache.clear()
        console.log('cleaned up resources')
    }

    /**
     * Calling this in response to a click will allow audio to play on Safari
     * and iOS, however the audio performance is awful
     * @returns
     */
    private fixAudioPermissions() {
        return
        if (this.fixedAudioPerms) return
        for (const [name, resource] of this.cache) {
            if (resource.type !== 'audio') continue
            const audio = (resource as AudioResource).audio
            const src = audio.src
            audio.src = src
        }

        this.fixedAudioPerms = true
    }

    private async loadSingleResource(url: string): Promise<Resource> {
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
                    return this.createImageResource(url, url)
                case 'mp3':
                    return this.createAudioResource(url, url)
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

            audio.onerror = e => {
                console.error(e)
                reject(e)
            }

            audio.onloadstart = () => {
                const resource: AudioResource = { type: 'audio', audio }
                this.cache.set(name, resource)
                console.log('loaded', name)
                audio.oncanplay = null
                resolve(resource)
            }
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

    async loadImports(items: { name: string; data: string | any }[]) {
        for (const item of items) {
            // could be imported via file-loader
            if (typeof item.data === 'string') {
                if (item.data.startsWith('data:image')) await this.createImageResource(item.name, item.data)
                else if (item.data.startsWith('data:audio')) await this.createAudioResource(item.name, item.data)
                else throw new Error('Unknown resource type')
            }
            // or url-loader
            else if ('src' in item.data) {
                const url = item.data.src
                switch (this.fileExt(item.data.src)) {
                    case 'png':
                    case 'jpg':
                    case 'jpeg':
                    case 'gif':
                        await this.createImageResource(item.name, url)
                        break
                    case 'mp3':
                        await this.createAudioResource(item.name, url)
                        break
                    default:
                        throw new Error(`Don't know how to load ${url}`)
                }
            }
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
