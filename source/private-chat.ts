import {Composer} from 'telegraf'

import {MyContext} from './types'

export const bot = new Composer<MyContext>()

bot.command(['start', 'help', 'peek', 'finish'], async ctx => {
	let text = ''
	text += ctx.i18n.t('private.start', {
		username: '@EdJoPaTo',
		repolink: 'https://github.com/EdJoPaTo/telegram-chat-record-bot'
	})
	return ctx.reply(text)
})
