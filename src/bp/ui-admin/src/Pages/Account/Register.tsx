import { lang } from 'botpress/shared'
import React, { FC, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { Redirect } from 'react-router-dom'
import BasicAuthentication from '~/Auth'
import { Button } from '@blueprintjs/core'

import { LoginContainer } from '../Layouts/LoginContainer'

import { RegisterForm } from './RegisterForm'

type Props = {
  auth: BasicAuthentication
} & RouteComponentProps<{ workspace: string }>

export const Register: FC<Props> = props => {
  const [error, setError] = useState<string>()
  const { registerUrl } = props.location.state

  const registerUser = async (email: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      return setError(lang.tr('admin.passwordsDontMatch'))
    }

    try {
      setError(undefined)
      await props.auth.register({ email, password }, registerUrl)
    } catch (err) {
      setError(err.message)
    }
  }

  const goToLogin = e => {
    props.history.push({ pathname: `/login/default` })
  }

  return (
    <LoginContainer
      title={lang.tr('admin.register')}
      // subtitle={lang.tr('admin.createMasterAdminAccount')}
      subtitle="Please create account"
      error={error}
    >
      <RegisterForm onRegister={registerUser} />
      <Button type="button" onClick={goToLogin} text={lang.tr('admin.signIn')} />
    </LoginContainer>
  )
}

export default Register
