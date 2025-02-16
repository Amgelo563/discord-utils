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
import { MessageLimits } from '../limits/MessageLimits';

export class ReplyWithCommand extends AbstractStandaloneCommand {
  public static readonly Instance = ReplyWithCommand.createFromEnv();

  protected static readonly EmptyCodeblockLength = codeBlock('').length;

  protected readonly ownerId: string;

  constructor(ownerId: string) {
    super();
    this.ownerId = ownerId;
  }

  public static createFromEnv(): ReplyWithCommand {
    const owner = process.env.OWNER_ID;
    if (!owner) {
      throw new Error('No owner found (OWNER_ID)');
    }

    return new ReplyWithCommand(owner);
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    if (interaction.user.id !== this.ownerId) {
      await interaction.reply({ content: 'Unauthorized', ephemeral: true });
      return;
    }
    const input = interaction.options.getString('input', true);
    await interaction.deferReply({ ephemeral: true });

    // Try to treat as an object
    try {
      const wrapped = input.startsWith('{') ? input : `{ ${input} }`;
      const parsed = eval(`(${wrapped})`);
      await interaction.editReply(parsed);
      return;
    } catch {
      // ignore, treat as code
    }

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

${input.startsWith('return') ? '' : 'return '}${input};
})`;

    const now = globalThis.performance.now();
    try {
      const reply = await eval(code)({
        interaction,
        guild: interaction.guild,
        channel: interaction.channel,
        message: interaction,
        user: interaction.user,
        member: interaction.member,
      });
      if (interaction.replied) {
        return;
      }

      await interaction.editReply(reply);
    } catch (error: any) {
      const after = performance.now();
      const title = `Output ${(after - now).toFixed(5)}ms`;
      const message = `${error.message}\n${error.stack}`;
      const embed = new EmbedBuilder()
        .setTitle(title)
        .addFields({ name: 'Input', value: input })
        .setColor('DarkRed');

      const maxGlobalLength =
        MessageLimits.Embed.Aggregate -
        embed.length -
        ReplyWithCommand.EmptyCodeblockLength;
      const maxDescriptionLength =
        MessageLimits.Embed.Description - ReplyWithCommand.EmptyCodeblockLength;
      const maxLength = Math.min(maxGlobalLength, maxDescriptionLength);

      const trimmed = message.slice(0, maxLength);
      embed.setDescription(codeBlock('js', trimmed));

      await interaction.editReply({ embeds: [embed] });
    }
  }

  protected createData(): SlashCommandOptionsOnlyBuilder {
    return new SlashCommandBuilder()
      .setName('reply-with')
      .setDescription('Evaluates code/objects and replies with the result')
      .addStringOption((option) =>
        option
          .setName('input')
          .setDescription('The code/object to evaluate/reply with')
          .setRequired(true),
      )
      .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
      .setContexts(
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel,
        InteractionContextType.Guild,
      );
  }
}
