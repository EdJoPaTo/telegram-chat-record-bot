import {Bot} from 'grammy'
import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'
import {I18n} from '@grammyjs/i18n'
import * as groupChat from './group-chat.js'
import * as privateChat from './private-chat.js'
import type {MyContext} from './types.js'

process.title = 'chat-record-tgbot'

const token = process.env['BOT_TOKEN']
if (!token) {
	throw new Error(
		'You have to provide the bot-token from @BotFather via environment variable (BOT_TOKEN)',
	)
}

const bot = new Bot<MyContext>(token)

if (process.env['NODE_ENV'] !== 'production') {
	bot.use(generateUpdateMiddleware())
}

const i18n = new I18n({
	defaultLocale: 'en',
	directory: 'locales',
})
bot.use(i18n.middleware())

bot.filter(o => o.chat?.type === 'private').use(privateChat.bot.middleware())
bot.filter(o => o.chat?.type === 'group' || o.chat?.type === 'supergroup')
	.use(groupChat.bot.middleware())

bot.on('my_chat_member', () => {
	// Dont care about membership changes.
	// The relevant ones are getting logged anyway.
	// TODO: remove this when ctx.chat.type === 'group' works for this as its better to be handled there.
})

bot.filter(o => o.chat?.type === 'channel').use(async ctx => {
	await ctx.reply(ctx.t('channel-fail'))
	return ctx.leaveChat()
})

if (process.env['NODE_ENV'] !== 'production') {
	bot.use(ctx => {
		console.warn('no one handled this', ctx.update)
	})
}

bot.catch((error: unknown) => {
	console.error('bot error occured', error)
})

async function startup(): Promise<void> {
	try {
		await bot.api.setMyCommands([
			{command: 'finish', description: 'finish recording'},
			{
				command: 'peek',
				description: 'peek at the current recording without ending it',
			},
		])

		const {username} = await bot.api.getMe()
		console.log(new Date(), 'Bot starts as', username)
		await bot.start()
	} catch (error: unknown) {
		console.error('startup failed:', error)
	}
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
startup()
