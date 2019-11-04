import {Composer} from 'telegraf'

export const bot = new Composer()

bot.command(['start', 'help', 'finish'], (ctx: any) => ctx.reply(ctx.i18n.t('private.start')))
