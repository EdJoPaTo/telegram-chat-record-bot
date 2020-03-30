import {Composer} from 'telegraf'

export const bot = new Composer()

bot.command(['start', 'help', 'peek', 'finish'], async ctx => {
	let text = ''
	text += (ctx as any).i18n.t('private.start', {
		username: '@EdJoPaTo',
		repolink: 'https://github.com/EdJoPaTo/telegram-chat-record-bot'
	})
	return ctx.reply(text)
})
