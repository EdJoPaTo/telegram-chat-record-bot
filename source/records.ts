import {KeyValueInMemoryFiles} from '@edjopato/datastore'
import {Message} from 'telegram-typings'

const data = new KeyValueInMemoryFiles<Message[]>('persist/records')

export async function add(message: Message): Promise<void> {
	const id = String(message.chat.id)
	const history = data.get(id) || []
	history.push(message)
	await data.set(id, history)
}

export function getAndDelete(chatId: number): Message[] {
	const history = data.get(String(chatId)) || []
	data.delete(String(chatId))
	return history
}
