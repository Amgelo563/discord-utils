import { AbstractStandaloneCommand } from '@nyx-discord/framework';
import type {
  ChatInputCommandInteraction,
  SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import {
  ApplicationIntegrationType,
  codeBlock,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { formatWithOptions } from 'node:util';
import { MessageLimits } from '../limits/MessageLimits';

export class EvalCommand extends AbstractStandaloneCommand {
  public static readonly Instance = EvalCommand.createFromEnv();

  protected static readonly EmptyCodeblockLength = codeBlock('').length;

  protected readonly ownerId: string;

  constructor(ownerId: string) {
    super();
    this.ownerId = ownerId;
  }

  public static createFromEnv(): EvalCommand {
    const owner = process.env.OWNER_ID;
    if (!owner) {
      throw new Error('No owner found (OWNER_ID)');
    }

    return new EvalCommand(owner);
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    if (interaction.user.id !== this.ownerId) {
      await interaction.reply({ content: 'Unauthorized', ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const rawCode = interaction.options.getString('code', true);
    const code = `(async (args) => {
const i = args.interaction;

const g = args.guild;
const guild = args.guild;

const c = args.channel;
const channel = args.channel;

const mess = args.message;
const message = args.message;

const u = args.user
const user = args.user;

const mem = args.member;
const member = args.member;

${rawCode.startsWith('return') ? '' : 'return '}${rawCode};
})`;
    const now = globalThis.performance.now();

    const embed = new EmbedBuilder()
      .setColor('Green')
      .addFields({ name: 'Input', value: rawCode });

    let result;
    try {
      const evalled = await eval(code)({
        interaction,
        guild: interaction.guild,
        channel: interaction.channel,
        message: interaction,
        user: interaction.user,
        member: interaction.member,
      });
      const depth = interaction.options.getInteger('depth') ?? 1;

      if (typeof evalled === 'object') {
        result = formatWithOptions({ depth }, '%O', evalled);
      } else {
        result = String(evalled);
      }
    } catch (error: any) {
      embed.setColor('DarkRed');
      result = `${error.message}\n${error.stack}`;
    }

    const after = performance.now();
    const title = `Output ${(after - now).toFixed(5)}ms`;
    embed.setTitle(title);

    const maxGlobalLength =
      MessageLimits.Embed.Aggregate -
      embed.length -
      EvalCommand.EmptyCodeblockLength;
    const maxDescriptionLength =
      MessageLimits.Embed.Description - EvalCommand.EmptyCodeblockLength;
    const maxLength = Math.min(maxGlobalLength, maxDescriptionLength);

    const trimmedResult = result.slice(0, maxLength);
    embed.setDescription(codeBlock('js', trimmedResult));

    await interaction.editReply({ embeds: [embed] });
  }

  protected createData(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName('eval')
      .setDescription('Evaluate code')
      .addStringOption((option) =>
        option
          .setName('code')
          .setDescription('The code to evaluate')
          .setRequired(true),
      )
      .addIntegerOption((option) =>
        option
          .setName('depth')
          .setDescription('The depth of the output')
          .setRequired(false),
      )
      .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
      .setContexts(
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel,
        InteractionContextType.Guild,
      );
  }
}
