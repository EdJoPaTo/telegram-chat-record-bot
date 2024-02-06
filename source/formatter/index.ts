import type {Message} from 'grammy/types';
import {plaintext} from './plaintext.js';
import {raw} from './simple.js';
import type {Result} from './type.js';

export * from './simple.js';
export * from './type.js';

export const FORMATS = ['raw', 'plaintext'] as const;
export type FormatType = typeof FORMATS[number];

export function formatByType(
	history: readonly Message[],
	type: FormatType,
): Result[] {
	// eslint-disable-next-line default-case
	switch (type) {
		case 'raw': {
			return raw(history);
		}

		case 'plaintext': {
			return plaintext(history);
		}
	}
}
