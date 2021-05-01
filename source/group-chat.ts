import {Composer} from 'telegraf'
import {Message} from 'typegram'

import {formatByType, FormatType, FORMATS} from './formatter'
import {MyContext} from './types'
import * as records from './records'

export const bot = new Composer<MyContext>()

bot.on('left_chat_member', (ctx, next) => {
	const user = ctx.message.left_chat_member
	if (user.username === ctx.me) {
		records.remove(ctx.chat.id)
		return
	}

	return next()
})

bot.on('message', async (ctx, next) => {
	if (!ctx.message) {
		return
	}

	if ('new_chat_members' in ctx.message && ctx.message.new_chat_members?.length === 1 && ctx.message.new_chat_members[0]?.username === ctx.me) {
		// Don't log myself joining the chat
		return ctx.reply(ctx.i18n.t('group.joined'))
	}

	if ('group_chat_created' in ctx.message || 'supergroup_chat_created' in ctx.message) {
		return ctx.reply(ctx.i18n.t('group.joined'))
	}

	if ('migrate_to_chat_id' in ctx.message) {
		await records.migrateToNewGroupId(ctx.chat.id, ctx.message.migrate_to_chat_id)
		return
	}

	if ('migrate_from_chat_id' in ctx.message) {
		return
	}

	return next()
})

bot.command('finish', async ctx => {
	await sendRecording(ctx)
	records.remove(ctx.chat.id)
	await ctx.reply(ctx.i18n.t('group.finish.greeting'))
	await ctx.leaveChat()
})

bot.command('peek', async ctx => {
	await ctx.reply(ctx.i18n.t('group.peek'))
	await sendRecording(ctx)
})

async function sendRecording(ctx: MyContext): Promise<void> {
	const history = records.get(ctx.chat!.id)
	if (history.length === 0) {
		await ctx.reply(ctx.i18n.t('group.finish.empty'))
		return
	}

	const filenameParts: Array<string | undefined> = []
	if ('title' in ctx.chat!) {
		filenameParts.push(ctx.chat.title)
	}

	filenameParts.push(
		new Date(history[0]!.date * 1000).toISOString().slice(0, -5)
	)

	const filenamePrefix = filenameParts
		.filter(o => o)
		.join('-')
		.replace(/[:/\\]/g, '-') + '-'

	await Promise.all(FORMATS.map(async o =>
		trySendDocument(ctx, filenamePrefix, history, o)
	))
}

bot.on('message', async ctx => {
	await records.add(ctx.message)
})

bot.on('edited_message', async ctx => {
	await records.add(ctx.editedMessage)
})

async function trySendDocument(ctx: MyContext, filenamePrefix: string, history: readonly Message[], formatType: FormatType): Promise<void> {
	try {
		const documents = formatByType(history, formatType)
		await Promise.all(
			documents.map(async o => ctx.replyWithDocument({
				filename: filenamePrefix + o.filenameSuffix,
				source: Buffer.from(o.content)
			}))
		)
	} catch (error: unknown) {
		console.error('ERROR sending', formatType, error)
		let text = ''
		text += `ERROR while sending ${formatType}`
		text += '\n\n'
		if (error instanceof Error) {
			text += error.message
		}

		await ctx.reply(text)
	}
}
