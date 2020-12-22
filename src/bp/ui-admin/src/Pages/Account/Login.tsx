import { lang } from 'botpress/shared'
import { AuthStrategyConfig } from 'common/typings'
import { get } from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { ExtendedHistory } from '~/history'

import api from '../../api'
import BasicAuthentication, { setActiveWorkspace, setChatUserAuth } from '../../Auth'
import { LoginContainer } from '../Layouts/LoginContainer'

import { AuthMethodPicker } from './AuthMethodPicker'
import { LoginForm } from './LoginForm'
import { Button } from '@blueprintjs/core'

type Props = {
  auth: BasicAuthentication
} & RouteComponentProps<{ strategy: string; workspace: string }> &
  ExtendedHistory

const Login: FC<Props> = props => {
  const [isLoading, setLoading] = useState(true)
  const [isFirstUser, setFirstUser] = useState(false)
  const [strategies, setStrategies] = useState<AuthStrategyConfig[]>()
  const [loginUrl, setLoginUrl] = useState('')
  const [redirectTo, setRedirectTo] = useState<string>()
  const [error, setError] = useState<string | null>()
  const registerUrl = '/register/basic/default'

  useEffect(() => {
    onStrategyChanged()
  }, [props.match.params.strategy, isLoading])

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    initialize()
  }, [])

  const initialize = async () => {
    const routeWorkspaceId = props.match.params.workspace
    const { workspaceId, botId, sessionId, signature, error } = props.location.query

    if (routeWorkspaceId || workspaceId) {
      setActiveWorkspace(routeWorkspaceId || workspaceId)
    }

    if (botId && sessionId && signature) {
      setChatUserAuth({ botId, sessionId, signature })
    }

    if (error) {
      setError(error)
    }

    if (props.auth.isAuthenticated()) {
      await props.auth.afterLoginRedirect()
    }

    if (!strategies) {
      await loadAuthConfig()
    }
  }

  const onStrategyChanged = () => {
    selectStrategy(props.match.params.strategy)

    if (strategies && strategies.length === 1) {
      updateUrlStrategy(strategies[0].strategyId)
      selectStrategy(strategies[0].strategyId)
    }

    if (props.location.state) {
      setRedirectTo(props.location.state.from)
    }
  }

  const loadAuthConfig = async () => {
    const { data } = await api.getAnonymous().get('/auth/config')

    setStrategies(data.payload.strategies)
    setFirstUser(data.payload.isFirstUser)
    setLoading(false)
  }

  const updateUrlStrategy = strategyId => props.history.push({ pathname: `/login/${strategyId}` })

  const selectStrategy = (id: string) => {
    const strategy = strategies && strategies.find(x => x.strategyId === id)
    if (!strategy) {
      return setLoginUrl('')
    }

    setError(undefined)

    const { strategyType, strategyId, registerUrl } = strategy

    if (strategyType === 'saml' || strategyType === 'oauth2') {
      return (window.location.href = `${api.getApiPath()}/auth/redirect/${strategyType}/${strategyId}`)
    }

    /**
     * isFirstUser - changing the logic to access the login page multiple times.
     * 
     *    if (isFirstUser) {
      props.history.push({ pathname: '/register', state: { registerUrl } })
    } else {
      setLoginUrl(strategy.loginUrl!)
    }
     */

    if (isFirstUser) {
      // props.history.push({ pathname: '/register', state: { registerUrl } })
      setLoginUrl(strategy.loginUrl!)
    } else {
      setLoginUrl(strategy.loginUrl!)
    }
  }

  const loginUser = async (email: string, password: string) => {
    try {
      setError(undefined)
      await props.auth.login({ email, password }, loginUrl, redirectTo)
    } catch (err) {
      if (err.type === 'PasswordExpiredError') {
        props.history.push({ pathname: '/changePassword', state: { email, password, loginUrl } })
      } else {
        setError(get(err, 'response.data.message', err.message))
      }
    }
  }

  if (isLoading || !strategies) {
    return null
  }

  const goTosignIn = e => {
    e.preventDefault()

    console.log('ok')
    props.history.push({ pathname: '/register', state: { registerUrl } })
  }

  return (
    <LoginContainer title={lang.tr('admin.login')} error={error} poweredBy={true}>
      {loginUrl ? (
        <div>
          <LoginForm onLogin={loginUser} />
          <Button
            tabIndex={4}
            type="button"
            id="btn-signin"
            text={lang.tr('admin.createAccount')}
            onClick={goTosignIn}
          />
        </div>
      ) : (
        <AuthMethodPicker strategies={strategies} onStrategySelected={updateUrlStrategy} />
      )}
      ,
    </LoginContainer>
  )
}

export default Login
