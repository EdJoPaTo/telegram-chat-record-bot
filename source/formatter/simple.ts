import {Message} from 'typegram'
import {Result} from './type'

export function raw(history: readonly Message[]): Result[] {
	const content = JSON.stringify(history, undefined, '\t') + '\n'
	return [{content, filenameSuffix: 'raw.json'}]
}
