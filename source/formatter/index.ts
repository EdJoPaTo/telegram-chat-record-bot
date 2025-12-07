import type {Message} from 'grammy/types';
import {plaintext} from './plaintext.ts';
import {raw} from './simple.ts';
import type {Result} from './type.ts';

export * from './simple.ts';
export type * from './type.ts';

export const FORMATS = ['raw', 'plaintext'] as const;
export type FormatType = (typeof FORMATS)[number];

export function formatByType(
	history: readonly Message[],
	type: FormatType,
): Result[] {
	switch (type) {
		case 'raw': {
			return raw(history);
		}

		case 'plaintext': {
			return plaintext(history);
		}
	}
}
