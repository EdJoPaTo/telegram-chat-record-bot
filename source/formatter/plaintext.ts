import type {Message} from 'grammy/types';
import {getEntites} from './helper.ts';
import type {Result} from './type.ts';

export function plaintext(history: readonly Message[]): Result[] {
	const messageDict: Record<number, Message> = {};
	for (const add of history) {
		messageDict[add.message_id] = add;
	}

	const messages = Object.values(messageDict)
		.sort((a, b) => a.message_id - b.message_id)
		.sort((a, b) => a.date - b.date);
	const entries = messages
		.map(o => formatIndividualMessage(o))
		.filter(Boolean);
	const linuxContent = entries.join('\n') + '\n';
	const windowsContent = linuxContent.replaceAll('\n', '\r\n');

	return [{content: windowsContent, filenameSuffix: 'plaintext.txt'}];
}

function formatIndividualMessage(message: Message): string {
	const sender = formatUser(message.from);
	const timestamp = formatTimestamp(message.date);
	const text = formatContent(message);

	return `${timestamp} <${sender}> ${text}`;
}

type MinimalUser = Readonly<{first_name: string; last_name?: string}>;
function formatUser(user: MinimalUser | undefined): string {
	if (!user) {
		return '';
	}

	let sender = user.first_name;
	if (user.last_name) {
		sender += ' ' + user.last_name;
	}

	return sender;
}

function formatTimestamp(unixTimestamp: number): string {
	return new Date(unixTimestamp * 1000).toISOString().slice(0, -5);
}

const OTHER_MESSAGE_TYPE_EXCLUDE = new Set([
	'caption',
	'chat',
	'date',
	'edit_date',
	'entities',
	'forward_date',
	'forward_from',
	'forward_from_chat',
	'forward_from_message_id',
	'forward_origin',
	'forward_sender_name',
	'forward_signature',
	'from',
	'link_preview_options',
	'message_id',
	'message_thread_id',
	'reply_to_message',
	'sender_chat',
	'text',
]);

function formatContent(message: Partial<Message>): string {
	const parts: string[] = [];

	if (message.forward_origin) {
		const origin = message.forward_origin;
		switch (origin.type) {
			case 'user': {
				const from = formatUser(origin.sender_user);
				parts.push(`forward <${from}>`);
				break;
			}

			case 'hidden_user': {
				parts.push(`forward <${origin.sender_user_name}>`);
				break;
			}

			case 'chat': {
				const chat = origin.sender_chat;
				if ('title' in chat) {
					let from = chat.title;
					if (origin.author_signature) {
						from += '; ' + origin.author_signature;
					}

					parts.push(`forward <${from}>`);
				} else {
					// Probably unused as origin.type user is likely used?
					const from = formatUser(chat);
					parts.push(`forward <${from}>`);
				}

				break;
			}

			case 'channel': {
				let from = origin.chat.title;
				if (origin.author_signature) {
					from += '; ' + origin.author_signature;
				}

				parts.push(`forward <${from}>`);
				break;
			}
		}
	}

	if ('reply_to_message' in message && message.reply_to_message) {
		const repliedToName = formatUser(message.reply_to_message.from);
		const repliedToContent = formatContent(message.reply_to_message);
		const shorted = repliedToContent.length > 20
			? repliedToContent.slice(0, 20) + '…'
			: repliedToContent;

		parts.push(`reply to <${repliedToName}> "${shorted}"`);
	}

	const contentTypes = (Object.keys(message) as Array<keyof Message>).filter(o => !OTHER_MESSAGE_TYPE_EXCLUDE.has(o));

	if (contentTypes.length > 0) {
		parts.push(`<${contentTypes.join(',')}>`);
	}

	if ('text' in message && message.text) {
		parts.push(message.text);
	}

	if ('caption' in message && message.caption) {
		parts.push(message.caption);
	}

	const entitiesOfInterest = getEntites(message).filter(o => o.type === 'text_link');
	if (entitiesOfInterest.length > 0) {
		parts.push(`[${entitiesOfInterest.map(o => o.url).join(', ')}]`);
	}

	return parts.join(' ');
}
