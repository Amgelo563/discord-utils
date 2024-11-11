import type { TopLevelCommand } from '@nyx-discord/core';
import { Bot } from '@nyx-discord/framework';
import { Client } from 'discord.js';
import { EvalCommand } from './commands/EvalCommand';
import { ReadEmbedsCommand } from './commands/ReadEmbedsCommand';
import { ReadMessageCommand } from './commands/ReadMessageCommand';

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error('No token found (DISCORD_TOKEN)');
}

const client = new Client({
  intents: [],
  allowedMentions: {
    parse: [],
  },
});

const bot = Bot.create(() => ({
  logger: console,
  client,
  id: Symbol('Bot'),
  token,
  deployCommands: true,
}));

const commands: TopLevelCommand[] = [
  ReadMessageCommand.Instance,
  ReadEmbedsCommand.Instance,
  EvalCommand.Instance,
];
void bot.getCommandManager().addCommands(...commands);

void bot.start();
