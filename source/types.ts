import type {I18nFlavor} from '@grammyjs/i18n';
import type {Context as BaseContext} from 'grammy';

export type MyContext = BaseContext & I18nFlavor;
