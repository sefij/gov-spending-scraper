import {
    downloadFileToLocalPath,
    EXTRACTED_FILES_FOLDER_NAME,
    fetchLinkContents,
    iterateOverExtractedFiles,
    stringIncludesRequestedYears
} from './dataUtils'
import {
    CombinedSourcesInterface,
    Dictionary,
    SourceContainer,
    SourceDescriptor
} from './models'

async function performFilterStep(
    data: Dictionary,
    mapSection: CombinedSourcesInterface,
    mapFilter: {
        filterProperty: string
        ref?: {
            urlProperty: string
            newSource: CombinedSourcesInterface
        }
    }
) {
    const allEntries: Dictionary[] = data[mapSection.propertyName]
    const filteredEntries = allEntries.filter((e) =>
        stringIncludesRequestedYears(e[mapFilter.filterProperty])
    )
    if (filteredEntries.length) {
        if (mapFilter.ref) {
            for (const entry of filteredEntries) {
                const newLinkContents = await fetchLinkContents(
                    entry[mapFilter.ref?.urlProperty]
                )
                await handleLinkContents(
                    newLinkContents,
                    mapFilter.ref?.newSource
                )
            }
        } else {
            for (const entry of filteredEntries) {
                await downloadFileToLocalPath(
                    entry[mapSection.filePropertyName as string],
                    EXTRACTED_FILES_FOLDER_NAME
                )
            }
        }
    }
}

async function handleLinkContents(
    data: Dictionary,
    mapSection: CombinedSourcesInterface
) {
    try {
        const mapContainer = (mapSection as SourceContainer).container
        const mapFilter = (mapSection as SourceDescriptor).filter
        if (mapContainer) {
            await handleLinkContents(
                data[mapSection.propertyName],
                mapContainer
            )
        } else if (mapFilter) {
            await performFilterStep(data, mapSection, mapFilter)
        } else {
            const allEntries: Dictionary[] = data[mapSection.propertyName]
            for (const entry of allEntries) {
                await downloadFileToLocalPath(
                    entry[mapSection.filePropertyName as string],
                    EXTRACTED_FILES_FOLDER_NAME
                )
            }
        }
    } catch (err) {
        console.error(
            `Failed handlling content: ${JSON.stringify({
                data,
                mapSection
            })}`
        )
    }
}

export async function fetchTransactionData() {
    const sourcesMap: { [rootLink: string]: CombinedSourcesInterface } = {
        'https://www.gov.uk/api/content/government/collections/spending-over-25-000':
            {
                propertyName: 'links',
                container: {
                    propertyName: 'documents',
                    filter: {
                        filterProperty: 'title',
                        ref: {
                            urlProperty: 'api_url',
                            newSource: {
                                propertyName: 'details',
                                container: {
                                    propertyName: 'attachments',
                                    filePropertyName: 'url'
                                }
                            }
                        }
                    }
                }
            },
        'https://www.gov.uk/api/content/government/collections/dfe-department-and-executive-agency-spend-over-25-000':
            {
                propertyName: 'links',
                container: {
                    propertyName: 'documents',
                    filter: {
                        filterProperty: 'title',
                        ref: {
                            urlProperty: 'api_url',
                            newSource: {
                                propertyName: 'details',
                                container: {
                                    propertyName: 'attachments',
                                    filter: {
                                        filterProperty: 'title'
                                    },
                                    filePropertyName: 'url'
                                }
                            }
                        }
                    }
                }
            }
    }
    for (const link in sourcesMap) {
        const responseData = await fetchLinkContents(link)
        await handleLinkContents(responseData, sourcesMap[link])
        iterateOverExtractedFiles()
    }
}

fetchTransactionData()
