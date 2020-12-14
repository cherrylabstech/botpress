import { NLU } from 'botpress/sdk'

export interface TrainInput {
  language: string
  topics: Topic[]
  entities: (ListEntity | PatternEntity)[]
  password: string
  seed?: number
}

export type TopicPred = { name: string } & NLU.TopicPrediction

export interface PredictInput {
  utterances: string[]
  password: string
}

export interface PredictOutput {
  entities: NLU.Entity[]
  topics: TopicPred[]
  utterance: string
  spellChecked: string
  detectedLanguage: string
}

export interface Topic {
  name: string
  intents: Intent[]
}

export interface Intent {
  name: string
  slots: Slot[]
  utterances: string[]
}

export interface Slot {
  name: string
  types: string[]
}

export interface ListEntity {
  name: string
  type: 'list'
  values: { name: string; synonyms: string[] }[]
  fuzzy: number
}

export interface PatternEntity {
  name: string
  type: 'pattern'
  regex: string
  case_sensitive: boolean
  examples: string[]
}
