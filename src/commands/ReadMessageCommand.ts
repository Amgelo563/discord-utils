import { AbstractContextMenuCommand } from '@nyx-discord/framework';
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  codeBlock,
  ContextMenuCommandBuilder,
  escapeMarkdown,
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
    const formatted = formatWithOptions({ depth: 2 }, '%O', message).slice(
      0,
      ReadMessageCommand.MaxLength,
    );
    const escaped = escapeMarkdown(formatted, {
      inlineCode: true,
      codeBlock: true,
    });

    const codeblock = codeBlock('js', escaped);

    await interaction.reply({ content: codeblock, ephemeral: true });
  }
}
