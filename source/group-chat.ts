import {Composer} from 'telegraf'
import {Message} from 'telegram-typings'

import * as records from './records'

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
	const content = JSON.stringify(history, undefined, '\t')

	let filename = ''
	filename += title
	filename += '-'

	const firstMessage: Message | undefined = history[0]
	if (firstMessage !== undefined) {
		const msgDate = new Date(firstMessage.date * 1000)
		filename += msgDate.toISOString().slice(0, -5)
		filename += '-'
	}

	filename += 'raw.json'

	filename = filename
		.replace(/[:/\\]/g, '-')

	await ctx.replyWithDocument({
		filename,
		source: Buffer.from(content)
	}, {
		caption: (ctx as any).i18n.t('group.finish.caption')
	})
	await ctx.leaveChat()
})

bot.on('message', async ctx => {
	await records.add(ctx.message!)
})

bot.on('edited_message', async ctx => {
	await records.add(ctx.editedMessage!)
})
