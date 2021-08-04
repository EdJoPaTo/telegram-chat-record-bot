import {Context as BaseContext} from 'grammy'
import {I18nContext} from '@edjopato/telegraf-i18n'

export interface MyContext extends BaseContext {
	readonly i18n: I18nContext;
}
