import {Message} from 'telegram-typings'
import {Result} from './type'

export function raw(history: readonly Message[]): Result[] {
	const content = JSON.stringify(history, undefined, '\t')
	return [{content, filenameSuffix: 'raw.json'}]
}
