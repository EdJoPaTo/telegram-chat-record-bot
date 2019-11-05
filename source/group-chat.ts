import {Composer, ContextMessageUpdate} from 'telegraf'
import {Message} from 'telegram-typings'

import * as records from './records'
import {formatByType, FormatType, FORMATS} from './formatter'

export const bot = new Composer()

bot.on('left_chat_member', (ctx, next) => {
	const user = ctx.message!.left_chat_member!
	if (user.username === ctx.me) {
		records.getAndDelete(ctx.chat!.id)
	} else {
		return next && next()
	}
})

bot.on('message', (ctx, next) => {
	if (!ctx.message) {
		return
	}

	if (ctx.message.new_chat_members && ctx.message.new_chat_members.length === 1 && ctx.message.new_chat_members[0].username === ctx.me) {
		// Don't log myself joining the chat
		return ctx.reply((ctx as any).i18n.t('group.joined'))
	}

	return next && next()
})

bot.command('finish', async ctx => {
	const {id, title} = ctx.chat!
	const history = records.getAndDelete(id)
	if (history.length === 0) {
		await ctx.reply((ctx as any).i18n.t('group.finish.empty'))
		await ctx.leaveChat()
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

	await ctx.leaveChat()
})

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
		text += error.message
		await ctx.reply(text)
	}
}
