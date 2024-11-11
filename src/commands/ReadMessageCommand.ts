import { AbstractContextMenuCommand } from '@nyx-discord/framework';
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  codeBlock,
  ContextMenuCommandBuilder,
  escapeCodeBlock,
  escapeInlineCode,
  InteractionContextType,
  type MessageContextMenuCommandInteraction,
} from 'discord.js';
import { formatWithOptions } from 'node:util';
import { MessageLimits } from '../limits/MessageLimits';

export class ReadMessageCommand extends AbstractContextMenuCommand {
  public static readonly Instance = new ReadMessageCommand();

  protected static readonly EmptyCodeblockLength = codeBlock('').length;

  protected static readonly MaxLength =
    MessageLimits.Content - ReadMessageCommand.EmptyCodeblockLength;

  protected static readonly MaxLengthRegex = new RegExp(
    `(.|[\r\n]){1,${ReadMessageCommand.MaxLength}}`,
    'g',
  );

  protected createData(): ContextMenuCommandBuilder {
    return new ContextMenuCommandBuilder()
      .setName('readMessage')
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
    const formatted = formatWithOptions({ depth: 2 }, '%O', message);
    const escaped = escapeCodeBlock(escapeInlineCode(formatted));

    const slicedParts = escaped.match(ReadMessageCommand.MaxLengthRegex);
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
