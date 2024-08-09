import { loadFile } from './load-file.main'
import * as path from 'path'
import asyncFs from 'fs/promises'
import * as fs from 'fs'
import { Readable } from 'stream'

export const EXTRACTED_FILES_FOLDER_NAME = 'extracted_files'

export const iterateOverExtractedFiles = async () => {
    const dirPath = path.join(__dirname, EXTRACTED_FILES_FOLDER_NAME)
    const paths: string[] = []
    try {
        const files = await asyncFs.readdir(dirPath)
        for (const file of files) {
            paths.push(path.join(dirPath, file))
        }
    } catch (err) {
        console.error('Failed to read directory')
    }

    for (const filePath of paths) {
        await loadFile(filePath)
    }
}

export const stringIncludesRequestedYears = (str: string) => {
    return /\b(202[0-9]|20[3-9][0-9]|2[1-9][0-9]{2}|[3-9][0-9]{3})\b/.test(str)
}

export const fetchLinkContents = async (link: string) => {
    const res = await fetch(link)
    const responseData = await res.json()
    return responseData
}

export const downloadFileToLocalPath = async (
    url: string,
    localPath: string
) => {
    const response = await fetch(url)

    if (!response || !response.ok) {
        throw new Error(`Failed to fetch the file: ${response.statusText}`)
    }

    const fileName = url.split('/').pop()
    if (response.body === null) {
        return
    }
    if (response.ok && response.body) {
        let writer = fs.createWriteStream(`${localPath}/${fileName}`)
        // @ts-ignore - null bodies already handled
        Readable.fromWeb(response.body).pipe(writer)
    }
}
