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

export type CombinedSourcesInterface = Section | SourceContainer | SourceDescriptor

export type Dictionary = {
    [key: string]: any
}