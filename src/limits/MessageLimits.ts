const EmbedLimits = {
  Title: 256,
  Description: 4096,

  Author: 256,
  Footer: 2048,

  Fields: 25,
  FieldName: 256,
  FieldValue: 1024,

  Message: 10,
  Aggregate: 6000,

  ShortDescription: 1500,
} as const satisfies Record<string, number>;

export const MessageLimits = {
  Embed: EmbedLimits,
  Content: 2000,
} as const;
