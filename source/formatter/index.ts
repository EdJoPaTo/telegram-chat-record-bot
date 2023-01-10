import type {Message} from 'grammy/types'
import {plaintext} from './plaintext.js'
import {raw} from './simple.js'
import type {Result} from './type.js'

export * from './type.js'
export * from './simple.js'

export type FormatType = 'raw' | 'plaintext'
export const FORMATS: FormatType[] = ['raw', 'plaintext']

export function formatByType(
	history: readonly Message[],
	type: FormatType,
): Result[] {
	switch (type) {
		case 'raw': {
			return raw(history)
		}

		case 'plaintext': {
			return plaintext(history)
		}

		default: {
			throw new Error('unknown type')
		}
	}
}
