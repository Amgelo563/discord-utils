import { AbstractContextMenuCommand } from '@nyx-discord/framework';
import type { MessageContextMenuCommandInteraction } from 'discord.js';
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  codeBlock,
  ContextMenuCommandBuilder,
  escapeMarkdown,
  InteractionContextType,
} from 'discord.js';
import { formatWithOptions } from 'node:util';
import { MessageLimits } from '../limits/MessageLimits';

export class ReadEmbedsCommand extends AbstractContextMenuCommand {
  public static readonly Instance = new ReadEmbedsCommand();

  protected static readonly EmptyCodeblockLength = codeBlock('').length;

  protected static readonly MaxLength =
    MessageLimits.Content - ReadEmbedsCommand.EmptyCodeblockLength;

  protected createData(): ContextMenuCommandBuilder {
    return new ContextMenuCommandBuilder()
      .setName('readEmbeds')
      .setType(ApplicationCommandType.Message)
      .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
      .setContexts(
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel,
        InteractionContextType.Guild,
      );
  }

  protected override async executeMessage(
    interaction: MessageContextMenuCommandInteraction,
  ): Promise<void> {
    const message = interaction.targetMessage;
    const { embeds } = message;
    const datas = embeds.map((embed) => embed.toJSON());

    const formatted = formatWithOptions({ depth: 3 }, '%O', datas);
    const escaped = escapeMarkdown(formatted, {
      inlineCode: true,
      codeBlock: true,
    });
    const sliced = escaped.slice(0, ReadEmbedsCommand.MaxLength);

    const codeblock = codeBlock('js', sliced);

    await interaction.reply({ content: codeblock, ephemeral: true });
  }
}
