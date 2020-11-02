import React, { createContext, useReducer, Dispatch } from 'react'
import { Dictionary } from 'lodash'
import { AgentType, EscalationType } from '../../../types'
import Reducer, { ActionType } from './Reducer'

type StoreType = {
  state: StateType
  dispatch: Dispatch<ActionType>
}

export type StateType = {
  readonly agents: Dictionary<AgentType>
  readonly escalations: Dictionary<EscalationType>
  readonly error?: any
}

const initialState: StateType = {
  agents: {},
  escalations: {},
  error: null
}

export const Context = createContext<StoreType>({ state: initialState, dispatch: () => null })

export const Store = ({ children }) => {
  const [state, dispatch] = useReducer(Reducer, initialState)
  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
}
