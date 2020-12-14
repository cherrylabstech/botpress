import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Application } from 'express'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import _ from 'lodash'
import ms from 'ms'
import Engine from 'nlu-core/engine'
import modelIdService from 'nlu-core/model-id-service'

import { authMiddleware, handleErrorLogging, handleUnexpectedError } from '../http-utils'
import Logger from '../simple-logger'

import ModelRepository from './model-repo'
import removeNoneIntent from './remove-none'
import TrainService from './train-service'
import TrainSessionService from './train-session-service'
import { PredictOutput } from './typings'
import { mapPredictOutput, mapTrainInput } from './utils'
import validateInput from './validation/validate'

export interface APIOptions {
  host: string
  port: number
  modelDir: string
  authToken?: string
  limitWindow: string
  limit: number
  bodySize: string
  batchSize: number
  silent: boolean
  modelCacheSize: string
}

const debug = DEBUG('api')
const debugRequest = debug.sub('request')

const createExpressApp = (options: APIOptions): Application => {
  const app = express()

  // This must be first, otherwise the /info endpoint can't be called when token is used
  app.use(cors())

  app.use(bodyParser.json({ limit: options.bodySize }))

  app.use((req, res, next) => {
    res.header('X-Powered-By', 'Botpress')
    debugRequest(`incoming ${req.path}`, { ip: req.ip })
    next()
  })

  app.use(handleUnexpectedError)

  if (process.core_env.REVERSE_PROXY) {
    app.set('trust proxy', process.core_env.REVERSE_PROXY)
  }

  if (options.limit > 0) {
    app.use(
      rateLimit({
        windowMs: ms(options.limitWindow),
        max: options.limit,
        message: 'Too many requests, please slow down'
      })
    )
  }

  if (options.authToken?.length) {
    app.use(authMiddleware(options.authToken))
  }

  return app
}

export default async function(options: APIOptions, engine: Engine) {
  const app = createExpressApp(options)
  const logger = new Logger('API', options.silent)

  const modelRepo = new ModelRepository(options.modelDir)
  await modelRepo.init()
  const trainSessionService = new TrainSessionService()
  const trainService = new TrainService(logger, engine, modelRepo, trainSessionService)

  const router = express.Router({ mergeParams: true })
  router.get('/info', async (req, res) => {
    const { nluVersion } = engine.getSpecifications()
    res.send({ version: nluVersion })
  })

  router.post('/train', async (req, res) => {
    try {
      const input = await validateInput(req.body)
      const { intents, entities, seed, language, password } = mapTrainInput(input)

      const pickedSeed = seed ?? Math.round(Math.random() * 10000)
      const modelId = modelIdService.makeId({
        specifications: engine.getSpecifications(),
        intentDefs: intents,
        entityDefs: entities,
        languageCode: language,
        seed: pickedSeed
      })

      // return the modelId as fast as possible
      // tslint:disable-next-line: no-floating-promises
      trainService.train(modelId, password, intents, entities, language, pickedSeed)

      return res.send({ success: true, modelId: modelIdService.toString(modelId) })
    } catch (err) {
      res.status(500).send({ success: false, error: err.message })
    }
  })

  router.get('/train/:modelId', async (req, res) => {
    try {
      const { modelId: stringId } = req.params
      if (!_.isString(stringId) || !modelIdService.isId(stringId)) {
        return res.status(400).send({ success: false, error: `model id "${stringId}" has invalid format` })
      }

      const { password } = req.query

      const modelId = modelIdService.fromString(stringId)
      let session = trainSessionService.getTrainingSession(modelId, password)
      if (!session) {
        const model = await modelRepo.getModel(modelId, password ?? '')

        if (!model) {
          return res
            .status(404)
            .send({ success: false, error: `no model or training could be found for modelId: ${stringId}` })
        }

        session = {
          key: stringId,
          status: 'done',
          progress: 1,
          language: model!.languageCode
        }
      }

      res.send({ success: true, session })
    } catch (err) {
      res.status(500).send({ success: false, error: err.message })
    }
  })

  router.post('/train/:modelId/cancel', async (req, res) => {
    try {
      const { modelId: stringId } = req.params
      let { password } = req.body
      password = password ?? ''

      const modelId = modelIdService.fromString(stringId)
      const session = trainSessionService.getTrainingSession(modelId, password)

      if (session?.status === 'training') {
        await engine.cancelTraining(session.key)
        return res.send({ success: true })
      }

      res.status(404).send({ success: false, error: `no current training for model id: ${stringId}` })
    } catch (err) {
      res.status(500).send({ success: false, error: err.message })
    }
  })

  router.post('/predict/:modelId', async (req, res) => {
    try {
      const { modelId: stringId } = req.params
      const { texts, password } = req.body

      if (!_.isArray(texts) || (options.batchSize > 0 && texts.length > options.batchSize)) {
        throw new Error(
          `Batch size of ${texts.length} is larger than the allowed maximum batch size (${options.batchSize}).`
        )
      }

      const modelId = modelIdService.fromString(stringId)
      if (!engine.hasModel(modelId)) {
        const model = await modelRepo.getModel(modelId, password)
        if (!model) {
          return res.status(404).send({ success: false, error: `modelId ${stringId} can't be found` })
        }

        await engine.loadModel(model)
      }

      const rawPredictions = await Promise.map(texts as string[], async utterance => {
        const detectedLanguage = await engine.detectLanguage(utterance, { [modelId.languageCode]: modelId })
        const spellChecked = await engine.spellCheck(utterance, modelId)
        const rawOutput = await engine.predict(utterance, modelId)
        const output = removeNoneIntent(rawOutput)
        return { ...output, utterance, spellChecked, detectedLanguage }
      })

      const predictions: PredictOutput[] = rawPredictions.map(mapPredictOutput)
      return res.send({ success: true, predictions })
    } catch (err) {
      res.status(500).send({ success: false, error: err.message })
    }
  })

  app.use(['/v1', '/'], router)
  app.use(handleErrorLogging)

  const httpServer = createServer(app)

  await Promise.fromCallback(callback => {
    const hostname = options.host === 'localhost' ? undefined : options.host
    httpServer.listen(options.port, hostname, undefined, callback)
  })

  logger.info(`NLU Server is ready at http://${options.host}:${options.port}/`)
}
