import {Message} from 'typegram'

import {Result} from './type'

import {plaintext} from './plaintext'
import {raw} from './simple'

export * from './type'
export * from './simple'

export type FormatType = 'raw' | 'plaintext'
export const FORMATS: FormatType[] = ['raw', 'plaintext']

export function formatByType(history: readonly Message[], type: FormatType): Result[] {
	switch (type) {
		case 'raw':
			return raw(history)
		case 'plaintext':
			return plaintext(history)
		default:
			throw new Error('unknown type')
	}
}
