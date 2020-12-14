import { Intent, ListEntity, PatternEntity, Slot, Topic, TrainInput } from '../typings'

import { validateTrainInput } from './validate'

/**
 * These unit tests don't cover all possible scenarios of training input, but they to more good than bad.
 * If we ever find a bug in train input validation, we'll just add some more tests.
 */

const CITY_ENUM: ListEntity = {
  name: 'city',
  type: 'list',
  fuzzy: 1,
  values: [
    { name: 'paris', synonyms: ['city of paris', 'la ville des lumières'] },
    { name: 'quebec', synonyms: [] }
  ]
}

const TICKET_PATTERN: PatternEntity = {
  name: 'ticket',
  type: 'pattern',
  case_sensitive: true,
  regex: '[A-Z]{3}-[0-9]{3}', // ABC-123
  examples: ['ABC-123']
}

const VARIABLE_CITY_FROM: Slot = { name: 'city-from', types: ['city'] }

const VARIABLE_TICKET_PROBLEM: Slot = { name: 'tick-with-problem', types: ['ticket'] }

const INTENT_FLY: Intent = {
  name: 'fly',
  utterances: ['fly from [city of paris](city-from) to anywhere', 'book a flight'],
  slots: [VARIABLE_CITY_FROM]
}

const INTENT_PROBLEM: Intent = {
  name: 'problem',
  utterances: ['problem with ticket $tick-with-problem', 'problem with ticket'],
  slots: [VARIABLE_TICKET_PROBLEM]
}

const EMPTY_INTENT: Intent = {
  name: 'empty',
  utterances: ['hahahahahahaha'],
  slots: []
}

const FLY_TOPIC: Topic = { name: 'fly', intents: [INTENT_FLY] }

const PROBLEM_TOPIC: Topic = { name: 'problem', intents: [INTENT_PROBLEM] }

const EMPTY_TOPIC: Topic = { name: 'empty', intents: [EMPTY_INTENT] }

const BOUILLON_TOPIC: Topic = {
  name: 'bouillon',
  intents: [
    {
      name: 'vote restaurant',
      utterances: ['I vote for $restaurant-to-vote'],
      slots: [{ name: 'restaurant-to-vote', types: ['restaurant'] }]
    }
  ]
}

const LANG = 'en'
const PW = 'Caput Draconis'

test('validate with correct format should pass', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [FLY_TOPIC],
    entities: [CITY_ENUM],
    language: LANG,
    password: PW,
    seed: 42
  }

  // act
  const validated = await validateTrainInput(trainInput)

  // assert
  expect(validated).toStrictEqual(trainInput)
})

test('validate without pw should set pw as empty string', async () => {
  // arrange
  const trainInput: Partial<TrainInput> = {
    topics: [FLY_TOPIC],
    entities: [CITY_ENUM],
    language: LANG,
    seed: 42
  }

  // act
  const validated = await validateTrainInput(trainInput)

  // assert
  expect(validated.password).toBe('')
})

test('validate with empty string pw should be allowed', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [FLY_TOPIC],
    entities: [CITY_ENUM],
    language: LANG,
    seed: 42,
    password: ''
  }

  // act
  const validated = await validateTrainInput(trainInput)

  // assert
  expect(validated.password).toBe('')
})

test('validate input without enums and patterns should pass', async () => {
  // arrange
  const trainInput: Omit<TrainInput, 'entities' | 'complexes'> = {
    topics: [EMPTY_TOPIC],
    language: LANG,
    password: PW,
    seed: 42
  }

  // act
  const validated = await validateTrainInput(trainInput)

  // assert
  const expected: TrainInput = { ...trainInput, entities: [] }
  expect(validated).toStrictEqual(expected)
})

test('validate input without topics or language should throw', async () => {
  // arrange
  const withoutTopic: Omit<TrainInput, 'entities' | 'topics' | 'complexes'> = {
    language: LANG,
    password: PW,
    seed: 42
  }

  const withoutLang: Omit<TrainInput, 'entities' | 'language' | 'complexes'> = {
    topics: [FLY_TOPIC],
    password: PW,
    seed: 42
  }

  // act & assert
  await expect(validateTrainInput(withoutTopic)).rejects.toThrow()
  await expect(validateTrainInput(withoutLang)).rejects.toThrow()
})

test('validate without intent should fail', async () => {
  // arrange
  const withoutIntent: Topic = { name: 'will break' } as Topic

  const trainInput: TrainInput = {
    topics: [withoutIntent],
    entities: [CITY_ENUM],
    language: LANG,
    password: PW,
    seed: 42
  }

  // act & assert
  await expect(validateTrainInput(trainInput)).rejects.toThrow()
})

test('validate enum without values or patterns without regexes or empty complex should fail', async () => {
  // arrange
  const incompleteEnum: ListEntity = { name: 'city' } as ListEntity

  const incompletePattern: PatternEntity = { name: 'password' } as PatternEntity

  const withoutValues: TrainInput = {
    topics: [FLY_TOPIC],
    entities: [incompleteEnum],
    language: LANG,
    password: PW,
    seed: 42
  }

  const withoutRegexes: TrainInput = {
    topics: [PROBLEM_TOPIC],
    language: LANG,
    password: PW,
    entities: [incompletePattern],
    seed: 42
  }

  // act & assert
  await expect(validateTrainInput(withoutValues)).rejects.toThrow()
  await expect(validateTrainInput(withoutRegexes)).rejects.toThrow()
})

test('validate with an unexisting referenced enum should throw', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [FLY_TOPIC],
    language: LANG,
    password: PW,
    entities: [TICKET_PATTERN],
    seed: 42
  }

  // act & assert
  await expect(validateTrainInput(trainInput)).rejects.toThrow()
})

test('validate with an unexisting referenced pattern should throw', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [PROBLEM_TOPIC],
    entities: [CITY_ENUM],
    language: LANG,
    password: PW,
    seed: 42
  }

  // act & assert
  await expect(validateTrainInput(trainInput)).rejects.toThrow()
})

test('validate with an unexisting referenced complex should throw', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [
      {
        name: 'bouillon',
        intents: [
          {
            name: 'vote restaurant',
            utterances: ['I vote for [Burger king](restaurant-to-vote)'],
            slots: [{ name: 'restaurant-to-vote', types: ['restaurant'] }]
          }
        ]
      }
    ],
    entities: [CITY_ENUM],
    language: LANG,
    password: PW,
    seed: 42
  }

  // act & assert
  await expect(validateTrainInput(trainInput)).rejects.toThrow()
})

test('validate with correct format but unexpected property should fail', async () => {
  // arrange
  const trainInput: TrainInput & { someProperty: any[] } = {
    topics: [FLY_TOPIC],
    entities: [CITY_ENUM],
    language: LANG,
    password: PW,
    seed: 42,
    someProperty: []
  }

  // act & assert
  await expect(validateTrainInput(trainInput)).rejects.toThrow()
})
