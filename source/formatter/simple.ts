import {Message} from 'grammy/types'

import {Result} from './type.js'

export function raw(history: readonly Message[]): Result[] {
	const content = JSON.stringify(history, undefined, '\t') + '\n'
	return [{content, filenameSuffix: 'raw.json'}]
}
