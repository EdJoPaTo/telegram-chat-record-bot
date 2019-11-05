import {Message} from 'telegram-typings'

import {Result} from './type'

import {raw} from './simple'

export * from './type'
export * from './simple'

export type FormatType = 'raw'
export const FORMATS: FormatType[] = ['raw']

export function formatByType(history: readonly Message[], type: FormatType): Result[] {
	switch (type) {
		case 'raw':
			return raw(history)
		default:
			throw new Error('unknown type')
	}
}
