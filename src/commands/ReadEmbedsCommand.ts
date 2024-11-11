import { AbstractContextMenuCommand } from '@nyx-discord/framework';
import type { MessageContextMenuCommandInteraction } from 'discord.js';
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  codeBlock,
  ContextMenuCommandBuilder,
  escapeCodeBlock,
  escapeInlineCode,
  InteractionContextType,
} from 'discord.js';
import { formatWithOptions } from 'node:util';
import { MessageLimits } from '../limits/MessageLimits';

export class ReadEmbedsCommand extends AbstractContextMenuCommand {
  public static readonly Instance = new ReadEmbedsCommand();

  protected static readonly EmptyCodeblockLength = codeBlock('').length;

  protected static readonly MaxLength =
    MessageLimits.Content - ReadEmbedsCommand.EmptyCodeblockLength;

  protected static readonly MaxLengthRegex = new RegExp(
    `.{1,${ReadEmbedsCommand.MaxLength}}`,
  );

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
    const escaped = escapeCodeBlock(escapeInlineCode(formatted));

    const slicedParts = escaped.match(ReadEmbedsCommand.MaxLengthRegex);
    if (!slicedParts) {
      await interaction.reply({
        content: 'Failed to match message',
        ephemeral: true,
      });
      return;
    }

    for (const [i, part] of slicedParts.entries()) {
      const codeblock = codeBlock('js', part);
      if (i === 0) {
        await interaction.reply({ content: codeblock, ephemeral: true });
      } else {
        await interaction.followUp({ content: codeblock, ephemeral: true });
      }
    }
  }
}
