import {Message, MessageEntity, User} from 'typegram'

import {getEntites} from './helper.js'
import {Result} from './type.js'

export function plaintext(history: readonly Message[]): Result[] {
	const messageDict: Record<number, Message> = {}
	for (const add of history) {
		messageDict[add.message_id] = add
	}

	const messages = Object.values(messageDict)
		.sort((a, b) => a.message_id - b.message_id)
		.sort((a, b) => a.date - b.date)
	const entries = messages
		.map(o => formatIndividualMessage(o))
		.filter(o => o)
	const linuxContent = entries.join('\n') + '\n'
	const windowsContent = linuxContent.replace(/\n/g, '\r\n')

	return [{content: windowsContent, filenameSuffix: 'plaintext.txt'}]
}

function formatIndividualMessage(message: Message): string {
	const sender = formatUser(message.from)
	const timestamp = formatTimestamp(message.date)
	const text = formatContent(message)

	return `${timestamp} <${sender}> ${text}`
}

function formatUser(user: User | undefined): string {
	if (!user) {
		return ''
	}

	let sender = user.first_name
	if (user.last_name) {
		sender += ' '
		sender += user.last_name
	}

	return sender
}

function formatTimestamp(unixTimestamp: number): string {
	return new Date(unixTimestamp * 1000).toISOString().slice(0, -5)
}

const OTHER_MESSAGE_TYPE_EXCLUDE: Set<string> = new Set([
	'caption',
	'chat',
	'date',
	'edit_date',
	'entities',
	'forward_date',
	'forward_from',
	'from',
	'message_id',
	'reply_to_message',
	'sender_chat',
	'text',
])

function formatContent(message: Partial<Message>): string {
	const parts: string[] = []

	if ('forward_from' in message) {
		const from = formatUser(message.forward_from)
		parts.push(`forward <${from}>`)
	}

	if ('reply_to_message' in message && message.reply_to_message) {
		const repliedToName = formatUser(message.reply_to_message.from)
		const repliedToContent = formatContent(message.reply_to_message)
		const shorted = repliedToContent.length > 20 ? repliedToContent.slice(0, 20) + '…' : repliedToContent

		parts.push(`reply to <${repliedToName}> "${shorted}"`)
	}

	const contentTypes = (Object.keys(message) as Array<keyof Message>)
		.filter(o => !OTHER_MESSAGE_TYPE_EXCLUDE.has(o))

	if (contentTypes.length > 0) {
		parts.push(`<${contentTypes.join(',')}>`)
	}

	if ('text' in message && message.text) {
		parts.push(message.text)
	}

	if ('caption' in message && message.caption) {
		parts.push(message.caption)
	}

	const entitiesOfInterest = getEntites(message)
		.filter((o): o is Readonly<MessageEntity.TextLinkMessageEntity> => o.type === 'text_link')
	if (entitiesOfInterest.length > 0) {
		parts.push(`[${entitiesOfInterest.map(o => o.url).join(', ')}]`)
	}

	return parts.join(' ')
}
