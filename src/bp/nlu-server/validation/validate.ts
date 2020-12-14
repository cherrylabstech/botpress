import { validate } from 'joi'
import { DUCKLING_ENTITIES } from 'nlu-core/entities/duckling-extractor'

import { Intent, ListEntity, PatternEntity, Slot, TrainInput } from '../typings'

import { TrainInputSchema } from './schemas'
import { isList, isPattern } from './utils'

const SLOT_ANY = 'any'

const makeVariableChecker = (lists: ListEntity[], patterns: PatternEntity[]) => (slot: Slot) => {
  const { types, name } = slot

  const supportedTypes = [...lists.map(e => e.name), ...patterns.map(p => p.name), ...DUCKLING_ENTITIES, SLOT_ANY]
  for (const type of types) {
    if (!supportedTypes.includes(type)) {
      throw new Error(`Variable ${name} references variable type ${type}, but it does not exist.`)
    }
  }
}

function validateIntent(intent: Intent, lists: ListEntity[], patterns: PatternEntity[]) {
  const variableChecker = makeVariableChecker(lists, patterns)
  intent.slots.forEach(variableChecker)
}

async function validateInput(rawInput: any): Promise<TrainInput> {
  const validatedInput: TrainInput = await validate(rawInput, TrainInputSchema, {})

  const { entities } = validatedInput

  const lists: ListEntity[] = entities.filter(isList)
  const patterns: PatternEntity[] = entities.filter(isPattern)

  for (const ctx of validatedInput.topics) {
    for (const intent of ctx.intents) {
      validateIntent(intent, lists, patterns)
    }
  }

  return validatedInput
}

export default validateInput
