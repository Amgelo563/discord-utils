import { AbstractContextMenuCommand } from '@nyx-discord/framework';
import type { MessageContextMenuCommandInteraction } from 'discord.js';
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  codeBlock,
  ContextMenuCommandBuilder,
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
      );
  }

  protected override async executeMessage(
    interaction: MessageContextMenuCommandInteraction,
  ): Promise<void> {
    const message = interaction.targetMessage;
    const { embeds } = message;
    const datas = embeds.map((embed) => embed.toJSON());

    const formatted = formatWithOptions({ depth: 2 }, '%O', datas).slice(
      0,
      ReadEmbedsCommand.MaxLength,
    );
    const codeblock = codeBlock('js', formatted);

    await interaction.reply({ content: codeblock, ephemeral: true });
  }
}
