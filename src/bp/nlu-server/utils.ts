import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import { Intent, ListEntity, PatternEntity, PredictOutput, Slot, TopicPred, TrainInput } from './typings'
import { isList, isPattern } from './validation/utils'

interface BpTrainInput {
  intents: NLU.IntentDefinition[]
  entities: NLU.EntityDefinition[]
  language: string
  password: string
  seed?: number
}

interface BpPredictOutput extends NLU.PredictOutput {
  spellChecked: string
  detectedLanguage: string
}

const mapVariable = (variable: Slot): NLU.SlotDefinition => {
  const { name, types } = variable
  return {
    entities: types,
    name,
    color: 0
  }
}

const makeIntentMapper = (ctx: string, lang: string) => (intent: Intent): NLU.IntentDefinition => {
  const { name, utterances, slots } = intent

  return {
    contexts: [ctx],
    filename: '',
    name,
    utterances: {
      [lang]: utterances
    },
    slots: slots.map(mapVariable)
  }
}

const mapList = (listDef: ListEntity): NLU.EntityDefinition => {
  const { name, fuzzy, values } = listDef

  return {
    id: name,
    name,
    type: 'list',
    fuzzy,
    occurrences: values
  }
}

const mapPattern = (pattern: PatternEntity): NLU.EntityDefinition => {
  const { name, regex, case_sensitive } = pattern

  return {
    id: name,
    name,
    type: 'pattern',
    pattern: regex,
    matchCase: case_sensitive
  }
}

export function mapTrainInput(trainInput: TrainInput): BpTrainInput {
  const { language, topics, entities, seed, password } = trainInput

  const listEntities = entities.filter(isList).map(mapList)
  const patternEntities = entities.filter(isPattern).map(mapPattern)

  const intents: NLU.IntentDefinition[] = _.flatMap(topics, t => {
    const intentMapper = makeIntentMapper(t.name, language)
    return t.intents.map(intentMapper)
  })

  return {
    language,
    entities: [...listEntities, ...patternEntities],
    intents,
    seed,
    password
  }
}

export function mapPredictOutput(predictOutput: BpPredictOutput): PredictOutput {
  const { entities, predictions, spellChecked, detectedLanguage } = predictOutput
  const topics: TopicPred[] = Object.entries(predictions).map(([name, value]) => ({ name, ...value }))
  return { entities, topics, spellChecked, detectedLanguage }
}
