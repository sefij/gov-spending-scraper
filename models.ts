interface Section {
    propertyName: string
    filePropertyName?: string
}

export interface SourceContainer extends Section {
    container: CombinedSourcesInterface
}

export interface SourceDescriptor extends Section {
    filter: {
        filterProperty: string
        ref?: {
            urlProperty: string
            newSource: CombinedSourcesInterface
        }
    }
}

export type CombinedSourcesInterface =
    | Section
    | SourceContainer
    | SourceDescriptor

export const isSourceContainer = (object: any): object is SourceContainer => {
    return 'container' in object
}
export const isSourceDescriptor = (object: any): object is SourceDescriptor => {
    return 'filter' in object
}

export type Dictionary = {
    [key: string]: any
}
