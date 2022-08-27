import type {Message, MessageEntity} from 'grammy/types'

export function getEntites(
	message: Partial<Message>,
): ReadonlyArray<Readonly<MessageEntity>> {
	if ('entities' in message && message.entities) {
		return message.entities
	}

	if ('caption_entities' in message && message.caption_entities) {
		return message.caption_entities
	}

	return []
}
