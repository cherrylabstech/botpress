import Joi from 'joi'

const ListOccurenceSchema = Joi.object({
  name: Joi.string().required(), // ex: 'Paris', 'Montreal', 'Québec'
  synonyms: Joi.array() // ex: 'La Ville des lumières', 'City of Paris'
    .items(Joi.string())
    .optional()
    .default([])
})

const ListEntitySchema = Joi.object().keys({
  name: Joi.string().required(), // ex: 'cities'
  type: Joi.string()
    .valid('list')
    .required(),
  values: Joi.array()
    .items(ListOccurenceSchema)
    .required()
    .min(1),
  fuzzy: Joi.number().default(0.9)
})

const PatternSchema = Joi.object().keys({
  name: Joi.string().required(),
  type: Joi.string()
    .valid('pattern')
    .required(),
  regex: Joi.string().required(),
  case_sensitive: Joi.bool().default(true),
  examples: Joi.array()
    .items(Joi.string())
    .optional()
    .default([])
})

const EntitiesSchema = Joi.alternatives().try(ListEntitySchema, PatternSchema)

const SlotSchema = Joi.object().keys({
  name: Joi.string().required(),
  types: Joi.array()
    .items(Joi.string())
    .optional()
    .default([])
})

const IntentSchema = Joi.object().keys({
  name: Joi.string().required(),
  slots: Joi.array()
    .items(SlotSchema)
    .optional()
    .default([]),
  utterances: Joi.array()
    .items(Joi.string())
    .required()
    .min(1)
})

const TopicSchema = Joi.object().keys({
  name: Joi.string().required(),
  intents: Joi.array()
    .items(IntentSchema)
    .required()
    .min(1)
})

export const TrainInputSchema = Joi.object().keys({
  language: Joi.string().required(),
  topics: Joi.array()
    .items(TopicSchema)
    .required(), // train input with empty topics array just for entity extraction is allowed
  entities: Joi.array()
    .items(EntitiesSchema)
    .optional()
    .default([]),
  password: Joi.string()
    .allow('')
    .optional()
    .default(''),
  seed: Joi.number().optional()
})

export const PredictInputSchema = Joi.object().keys({
  utterances: Joi.array()
    .items(Joi.string())
    .required(),
  password: Joi.string()
    .allow('')
    .optional()
    .default('')
})
