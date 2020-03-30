import {KeyValueInMemoryFiles} from '@edjopato/datastore'
import {Message} from 'telegram-typings'

const data = new KeyValueInMemoryFiles<Message[]>('persist/records')

export async function add(message: Message): Promise<void> {
	const id = String(message.chat.id)
	const history = data.get(id) ?? []
	history.push(message)
	await data.set(id, history)
}

export function remove(chatId: number): void {
	data.delete(String(chatId))
}

export function get(chatId: number): Message[] {
	return data.get(String(chatId)) ?? []
}

export async function migrateToNewGroupId(oldChatId: number, newChatId: number): Promise<void> {
	const history = data.get(String(oldChatId))
	if (!history) {
		return
	}

	await data.set(String(newChatId), history)
	data.delete(String(oldChatId))
}
