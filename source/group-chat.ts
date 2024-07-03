import {Composer, InputFile} from 'grammy';
import type {Message} from 'grammy/types';
import {formatByType, FORMATS, type FormatType} from './formatter/index.js';
import * as records from './records.js';
import type {MyContext} from './types.js';

export const bot = new Composer<MyContext>();

bot.on(':left_chat_member:me', ctx => {
	records.remove(ctx.chat.id);
});

bot.on(':new_chat_members:me', async ctx => {
	// Don't log myself joining the chat
	await ctx.reply(ctx.t('group-joined'));
});

bot.on([':group_chat_created', ':supergroup_chat_created'], async ctx => {
	await ctx.reply(ctx.t('group-joined'));
});

bot.on(':migrate_to_chat_id', async ctx => {
	await records.migrateToNewGroupId(
		ctx.chat.id,
		ctx.message!.migrate_to_chat_id,
	);
});

bot.on(':migrate_from_chat_id', () => {
	// Already handled with migrate_to_chat
});

bot.on('my_chat_member', () => {
	// Already handled via other events
});

bot.command('finish', async ctx => {
	await sendRecording(ctx);
	records.remove(ctx.chat.id);
	await ctx.reply(ctx.t('group-finish-greeting'));
	await ctx.leaveChat();
});

bot.command('peek', async ctx => {
	await ctx.reply(ctx.t('group-peek'));
	await sendRecording(ctx);
});

bot.command('privacy', async ctx =>
	ctx.reply(
		ctx.t('group-privacy', {
			repolink: 'https://github.com/EdJoPaTo/telegram-chat-record-bot',
		}),
	));

async function sendRecording(ctx: MyContext): Promise<void> {
	const history = records.get(ctx.chat!.id);
	if (history.length === 0) {
		await ctx.reply(ctx.t('group-finish-empty'));
		return;
	}

	const filenameParts: Array<string | undefined> = [];
	if ('title' in ctx.chat!) {
		filenameParts.push(ctx.chat.title);
	}

	filenameParts.push(
		new Date(history[0]!.date * 1000).toISOString().slice(0, -5),
	);

	const filenamePrefix = filenameParts
		.filter(Boolean)
		.join('-')
		.replaceAll(/[:/\\]/g, '-') + '-';

	await Promise.all(
		FORMATS.map(async o => trySendDocument(ctx, filenamePrefix, history, o)),
	);
}

bot.on('message', async ctx => {
	await records.add(ctx.message);
});

bot.on('edited_message', async ctx => {
	await records.add(ctx.editedMessage);
});

async function trySendDocument(
	ctx: MyContext,
	filenamePrefix: string,
	history: readonly Message[],
	formatType: FormatType,
): Promise<void> {
	try {
		const documents = formatByType(history, formatType);
		await Promise.all(
			documents.map(async o =>
				ctx.replyWithDocument(
					new InputFile(
						new TextEncoder().encode(o.content),
						filenamePrefix + o.filenameSuffix,
					),
				),
			),
		);
	} catch (error: unknown) {
		console.error('ERROR sending', formatType, error);
		let text = '';
		text += `ERROR while sending ${formatType}`;
		text += '\n\n';
		if (error instanceof Error) {
			text += error.message;
		}

		await ctx.reply(text);
	}
}
