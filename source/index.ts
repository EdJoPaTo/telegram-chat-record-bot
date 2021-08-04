import {existsSync, readFileSync} from 'fs'

import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'
import {I18n as TelegrafI18n} from '@edjopato/telegraf-i18n'
import {Telegraf, Composer} from 'telegraf'

import {MyContext} from './types.js'
import * as groupChat from './group-chat.js'
import * as privateChat from './private-chat.js'

process.title = 'chat-record-tgbot'

const token = (existsSync('/run/secrets/bot-token.txt') && readFileSync('/run/secrets/bot-token.txt', 'utf8').trim())
	|| (existsSync('bot-token.txt') && readFileSync('bot-token.txt', 'utf8').trim())
	|| process.env['BOT_TOKEN']
if (!token) {
	throw new Error('You have to provide the bot-token from @BotFather via file (bot-token.txt) or environment variable (BOT_TOKEN)')
}

const bot = new Telegraf<MyContext>(token)

if (process.env['NODE_ENV'] !== 'production') {
	bot.use(generateUpdateMiddleware())
}

const i18n = new TelegrafI18n({
	directory: 'locales',
	defaultLanguage: 'en',
	defaultLanguageOnMissing: true,
	useSession: false,
})

bot.use(i18n.middleware())

bot.use(Composer.privateChat(privateChat.bot.middleware()))
bot.use(Composer.groupChat(groupChat.bot.middleware()))

bot.use(Composer.chatType('channel', async ctx => {
	await ctx.reply(ctx.i18n.t('channel.fail'))
	return ctx.leaveChat()
}))

if (process.env['NODE_ENV'] !== 'production') {
	bot.use(ctx => {
		console.warn('no one handled this', ctx.updateType, ctx.update)
	})
}

bot.catch((error: unknown) => {
	console.error('telegraf error occured', error)
})

async function startup(): Promise<void> {
	try {
		await bot.telegram.setMyCommands([
			{command: 'finish', description: 'finish recording'},
			{command: 'peek', description: 'peek at the current recording without ending it'},
		])

		await bot.launch()
		console.log(new Date(), 'Bot started as', bot.botInfo?.username)
	} catch (error: unknown) {
		console.error('startup failed:', error)
	}
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
startup()
