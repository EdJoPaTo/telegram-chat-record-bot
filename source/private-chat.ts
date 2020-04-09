import {Composer} from 'telegraf'
import I18n from 'telegraf-i18n'

export const bot = new Composer()

bot.command(['start', 'help', 'peek', 'finish'], async ctx => {
	const i18n = (ctx as any).i18n as I18n
	let text = ''
	text += i18n.t('private.start', {
		username: '@EdJoPaTo',
		repolink: 'https://github.com/EdJoPaTo/telegram-chat-record-bot'
	})
	return ctx.reply(text)
})
