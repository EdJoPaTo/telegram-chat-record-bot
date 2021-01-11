import {Context as TelegrafContext} from 'telegraf'
import {I18nContext} from '@edjopato/telegraf-i18n'

export interface MyContext extends TelegrafContext {
	readonly i18n: I18nContext;
}
