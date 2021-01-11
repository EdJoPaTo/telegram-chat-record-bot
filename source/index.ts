import {existsSync, readFileSync} from 'fs'

import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'
import {I18n as TelegrafI18n} from '@edjopato/telegraf-i18n'
import {Telegraf, Composer} from 'telegraf'

import {MyContext} from './types'
import * as groupChat from './group-chat'
import * as privateChat from './private-chat'

process.title = 'chat-record-tgbot'

const tokenFilePath = existsSync('/run/secrets') ? '/run/secrets/bot-token.txt' : 'bot-token.txt'
const token = readFileSync(tokenFilePath, 'utf8').trim()
const bot = new Telegraf<MyContext>(token)

if (process.env.NODE_ENV !== 'production') {
	bot.use(generateUpdateMiddleware())
}

const i18n = new TelegrafI18n({
	directory: 'locales',
	defaultLanguage: 'en',
	defaultLanguageOnMissing: true,
	useSession: false
})

bot.use(i18n.middleware())

bot.use(Composer.privateChat(privateChat.bot.middleware()))
bot.use(Composer.groupChat(groupChat.bot.middleware()))

bot.use(Composer.chatType('channel', async ctx => {
	await ctx.reply(ctx.i18n.t('channel.fail'))
	return ctx.leaveChat()
}))

if (process.env.NODE_ENV !== 'production') {
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
			{command: 'peek', description: 'peek at the current recording without ending it'}
		])

		await bot.launch()
		console.log(new Date(), 'Bot started as', bot.botInfo?.username)
	} catch (error: unknown) {
		console.error('startup failed:', error)
	}
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
startup()
