export interface AccessToken {
    access_token: string
    expires_in: number
    token_type: string
}

export interface Tracks {
    href: string
    items: ItemTrack[]
    limit: number
    next: string | null
    offset: number
    previous: string | null
    total: number
}

export interface Album {
    album_type: string
    artists: Artist[]
    id: string
    images: Image[]
    name: string
    type: string
}

export interface Artist {
    id: string
    name: string
    type: string
}

export interface Image {
    height: number
    url: string
    width: number
}

export interface ItemTrack {
    album: Album
    artists: Artist[]
    id: string
    name: string
    preview_url: string
    type: string
}