/* eslint @typescript-eslint/prefer-optional-chain: off */

import {Composer, ContextMessageUpdate} from 'telegraf'
import {Message} from 'telegram-typings'
import I18n from 'telegraf-i18n'

import * as records from './records'
import {formatByType, FormatType, FORMATS} from './formatter'

export const bot = new Composer()

bot.on('left_chat_member', (ctx, next) => {
	const user = ctx.message!.left_chat_member!
	if (user.username === ctx.me) {
		records.remove(ctx.chat!.id)
	} else {
		return next && next()
	}
})

bot.on('message', async (ctx, next) => {
	if (!ctx.message) {
		return
	}

	const i18n = (ctx as any).i18n as I18n

	if (ctx.message.new_chat_members && ctx.message.new_chat_members.length === 1 && ctx.message.new_chat_members[0].username === ctx.me) {
		// Don't log myself joining the chat
		return ctx.reply(i18n.t('group.joined'))
	}

	if (ctx.message.group_chat_created || ctx.message.supergroup_chat_created) {
		return ctx.reply(i18n.t('group.joined'))
	}

	if (ctx.message.migrate_to_chat_id) {
		await records.migrateToNewGroupId(ctx.chat!.id, ctx.message.migrate_to_chat_id)
		return
	}

	if (ctx.message.migrate_from_chat_id) {
		return
	}

	return next && next()
})

bot.command('finish', async ctx => {
	const i18n = (ctx as any).i18n as I18n
	await sendRecording(ctx)
	records.remove(ctx.chat!.id)
	await ctx.reply(i18n.t('group.finish.greeting'))
	await ctx.leaveChat()
})

bot.command('peek', async ctx => {
	const i18n = (ctx as any).i18n as I18n
	await ctx.reply(i18n.t('group.peek'))
	await sendRecording(ctx)
})

async function sendRecording(ctx: ContextMessageUpdate): Promise<void> {
	const i18n = (ctx as any).i18n as I18n
	const {id, title} = ctx.chat!
	const history = records.get(id)
	if (history.length === 0) {
		await ctx.reply(i18n.t('group.finish.empty'))
		return
	}

	const filenameParts: Array<string | undefined> = []
	filenameParts.push(title)
	filenameParts.push(
		new Date(history[0].date * 1000).toISOString().slice(0, -5)
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
	await records.add(ctx.message!)
})

bot.on('edited_message', async ctx => {
	await records.add(ctx.editedMessage!)
})

async function trySendDocument(ctx: ContextMessageUpdate, filenamePrefix: string, history: readonly Message[], formatType: FormatType): Promise<void> {
	try {
		const documents = formatByType(history, formatType)
		await Promise.all(
			documents.map(async o => ctx.replyWithDocument({
				filename: filenamePrefix + o.filenameSuffix,
				source: Buffer.from(o.content)
			}))
		)
	} catch (error) {
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
