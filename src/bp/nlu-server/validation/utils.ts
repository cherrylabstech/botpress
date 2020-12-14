import { ListEntity, PatternEntity } from 'nlu-server/typings'

export const isList = (e: ListEntity | PatternEntity): e is ListEntity => e.type === 'list'
export const isPattern = (e: ListEntity | PatternEntity): e is PatternEntity => e.type === 'pattern'
