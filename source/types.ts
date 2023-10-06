import type {Context as BaseContext} from 'grammy';
import type {I18nFlavor} from '@grammyjs/i18n';

export type MyContext = BaseContext & I18nFlavor;
