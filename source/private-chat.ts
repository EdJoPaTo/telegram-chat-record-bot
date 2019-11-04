import {Composer} from 'telegraf'

export const bot = new Composer()

bot.start((ctx: any) => ctx.reply(ctx.i18n.t('private.start')))
