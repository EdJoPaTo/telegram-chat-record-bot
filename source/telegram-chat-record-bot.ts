import {env} from 'node:process'
import {Bot} from 'grammy'
import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'
import {I18n} from '@grammyjs/i18n'
import * as groupChat from './group-chat.js'
import * as privateChat from './private-chat.js'
import type {MyContext} from './types.js'

const token = env['BOT_TOKEN']
if (!token) {
	throw new Error(
		'You have to provide the bot-token from @BotFather via environment variable (BOT_TOKEN)',
	)
}

const baseBot = new Bot<MyContext>(token)

if (env['NODE_ENV'] !== 'production') {
	baseBot.use(generateUpdateMiddleware())
}

const bot = baseBot.errorBoundary(({error}) => {
	console.error('bot error occured', error)
})

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

if (env['NODE_ENV'] !== 'production') {
	bot.use(ctx => {
		console.warn('no one handled this', ctx.update)
	})
}

await baseBot.api.setMyCommands([
	{command: 'finish', description: 'finish recording'},
	{
		command: 'peek',
		description: 'peek at the current recording without ending it',
	},
])

await baseBot.start({
	onStart(botInfo) {
		console.log(new Date(), 'Bot starts as', botInfo.username)
	},
})
